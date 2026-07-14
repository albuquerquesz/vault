import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { PluggyApiError, PluggyAuthError } from "../clients/pluggy";
import { db } from "../db";
import { pluggyAccounts, pluggyItems, pluggyTransactions } from "../db/schema";
import { requireSession } from "../index";
import {
	MissingPluggyCredentialsError,
	resolvePluggyCredentials,
} from "../services/connectors/credentials";
import {
	createPluggyService,
	deleteDerivedExpensesForItem,
	isPluggyItemMissing,
	markPluggyItemAsOrphaned,
	persistPluggyItemAndSync,
	syncTransactionsForItem,
	toPluggyUserMessage,
} from "../services/pluggy";
import { getPluggyWebhookUrl } from "../services/pluggy-webhook-config";

function sendKnownError(
	reply: { status: (code: number) => { send: (body: unknown) => unknown } },
	error: unknown,
) {
	if ((error as { statusCode?: number }).statusCode === 401) {
		return reply.status(401).send({ error: "Authentication required" });
	}
	if (error instanceof MissingPluggyCredentialsError) {
		return reply.status(error.statusCode).send({ error: error.message });
	}
	if (error instanceof PluggyAuthError) {
		return reply.status(error.statusCode).send({ error: error.message });
	}
	if (error instanceof PluggyApiError) {
		return reply.status(error.statusCode).send({ error: error.message });
	}
	if (error instanceof z.ZodError) {
		return reply.status(400).send({ error: error.message });
	}
	throw error;
}

export function registerPluggyRoutes(server: FastifyInstance) {
	// POST /api/pluggy/connect - create a connect token and return the Pluggy Connect URL
	server.route({
		method: "POST",
		url: "/connect",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const creds = await resolvePluggyCredentials(session.user.id);
				const pluggy = createPluggyService(creds);
				const webhookUrl = getPluggyWebhookUrl();
				const token = await pluggy.createConnectToken({
					clientUserId: session.user.id,
					// Only attach a public HTTPS webhook; Pluggy rejects localhost.
					...(webhookUrl.startsWith("https://") ? { webhookUrl } : {}),
				});
				return reply.send({
					url: `https://connect.pluggy.ai/connect?token=${token.accessToken}`,
				});
			} catch (error) {
				return sendKnownError(reply, error);
			}
		},
	});

	server.route({
		method: "GET",
		url: "/items",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const items = await db
					.select()
					.from(pluggyItems)
					.where(eq(pluggyItems.userId, session.user.id));
				return reply.send(items);
			} catch (error) {
				return sendKnownError(reply, error);
			}
		},
	});

	// POST /api/pluggy/items - register a Pluggy item and sync initial transactions
	server.route({
		method: "POST",
		url: "/items",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const { pluggyItemId } = z
					.object({
						pluggyItemId: z.string(),
					})
					.parse(req.body);
				const creds = await resolvePluggyCredentials(session.user.id);
				const result = await persistPluggyItemAndSync({
					userId: session.user.id,
					pluggyItemId,
					creds,
				});

				return reply.status(201).send(result);
			} catch (error) {
				return sendKnownError(reply, error);
			}
		},
	});

	// GET /api/pluggy/accounts - list accounts for a user
	server.route({
		method: "GET",
		url: "/accounts",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const userItems = await db
					.select({ id: pluggyItems.id })
					.from(pluggyItems)
					.where(eq(pluggyItems.userId, session.user.id));

				if (userItems.length === 0) {
					return reply.send([]);
				}

				const itemIds = userItems.map((i) => i.id);
				const accounts = await db
					.select({
						id: pluggyAccounts.id,
						pluggyItemId: pluggyAccounts.pluggyItemId,
						pluggyAccountId: pluggyAccounts.pluggyAccountId,
						type: pluggyAccounts.type,
						subtype: pluggyAccounts.subtype,
						name: pluggyAccounts.name,
						balance: pluggyAccounts.balance,
						availableBalance: pluggyAccounts.availableBalance,
						currency: pluggyAccounts.currency,
						transferNumber: pluggyAccounts.transferNumber,
						brand: pluggyAccounts.brand,
						status: pluggyAccounts.status,
						provider: pluggyItems.provider,
					})
					.from(pluggyAccounts)
					.innerJoin(
						pluggyItems,
						eq(pluggyAccounts.pluggyItemId, pluggyItems.id),
					)
					.where(inArray(pluggyAccounts.pluggyItemId, itemIds));

				return reply.send(accounts);
			} catch (error) {
				return sendKnownError(reply, error);
			}
		},
	});

	server.route({
		method: "POST",
		url: "/sync/:itemId",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const { itemId } = z.object({ itemId: z.string() }).parse(req.params);

				const item = await db
					.select()
					.from(pluggyItems)
					.where(
						and(
							eq(pluggyItems.id, itemId),
							eq(pluggyItems.userId, session.user.id),
						),
					)
					.limit(1)
					.then((r) => r[0]);

				if (!item) {
					return reply.status(404).send({ error: "Item not found" });
				}

				const creds = await resolvePluggyCredentials(session.user.id);
				const service = createPluggyService(creds);
				const sync = await syncTransactionsForItem({
					service,
					userId: session.user.id,
					localItemId: item.id,
					pluggyItemId: item.pluggyItemId,
				});

				return reply.send({ itemId: item.id, sync });
			} catch (error) {
				const { itemId } = z.object({ itemId: z.string() }).parse(req.params);
				if (isPluggyItemMissing(error)) {
					await markPluggyItemAsOrphaned(itemId);
					return reply.status(409).send({
						error: toPluggyUserMessage(error),
						code: "PLUGGY_ITEM_ORPHANED",
					});
				}
				return sendKnownError(reply, error);
			}
		},
	});

	server.route({
		method: "DELETE",
		url: "/items/:pluggyItemId",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const { pluggyItemId } = z
					.object({ pluggyItemId: z.string() })
					.parse(req.params);
				const item = await db
					.select()
					.from(pluggyItems)
					.where(
						and(
							eq(pluggyItems.userId, session.user.id),
							eq(pluggyItems.id, pluggyItemId),
						),
					)
					.limit(1)
					.then((r) => r[0]);
				if (!item) return reply.status(404).send({ error: "Item not found" });

				const creds = await resolvePluggyCredentials(session.user.id);
				const pluggy = createPluggyService(creds);
				try {
					await pluggy.deleteItem(item.pluggyItemId);
				} catch (error) {
					if (!isPluggyItemMissing(error)) {
						throw error;
					}
				}
				await deleteDerivedExpensesForItem(item.id);
				await db
					.delete(pluggyTransactions)
					.where(eq(pluggyTransactions.pluggyItemId, item.id));
				await db.delete(pluggyItems).where(eq(pluggyItems.id, item.id));
				return reply.code(204).send();
			} catch (error) {
				return sendKnownError(reply, error);
			}
		},
	});

	server.route({
		method: "GET",
		url: "/transactions",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const query = req.query as {
					limit?: string;
					itemId?: string;
					accountId?: string;
				};
				const limit = Number(query.limit) || 20;

				const transactionSelect = {
					id: pluggyTransactions.id,
					pluggyTransactionId: pluggyTransactions.pluggyTransactionId,
					date: pluggyTransactions.date,
					amount: pluggyTransactions.amount,
					description: pluggyTransactions.description,
					category: pluggyTransactions.category,
					provider: pluggyItems.provider,
					pluggyAccountId: pluggyTransactions.pluggyAccountId,
					accountName: pluggyAccounts.name,
					accountType: pluggyAccounts.type,
					accountSubtype: pluggyAccounts.subtype,
					accountBrand: pluggyAccounts.brand,
					remoteAccountId: pluggyAccounts.pluggyAccountId,
				};

				const transactionsBase = () =>
					db
						.select(transactionSelect)
						.from(pluggyTransactions)
						.innerJoin(
							pluggyItems,
							eq(pluggyTransactions.pluggyItemId, pluggyItems.id),
						)
						.leftJoin(
							pluggyAccounts,
							eq(pluggyTransactions.pluggyAccountId, pluggyAccounts.id),
						);

				if (query.itemId) {
					const item = await db
						.select()
						.from(pluggyItems)
						.where(
							and(
								eq(pluggyItems.id, query.itemId),
								eq(pluggyItems.userId, session.user.id),
							),
						)
						.limit(1)
						.then((r) => r[0]);

					if (!item) return reply.send([]);

					const transactions = await transactionsBase()
						.where(
							and(
								isNull(pluggyTransactions.hiddenAt),
								eq(pluggyItems.id, item.id),
							),
						)
						.orderBy(desc(pluggyTransactions.date))
						.limit(limit);
					return reply.send(transactions);
				}

				if (query.accountId) {
					const account = await db
						.select()
						.from(pluggyAccounts)
						.where(eq(pluggyAccounts.id, query.accountId))
						.limit(1)
						.then((r) => r[0]);

					if (!account) return reply.send([]);

					const item = await db
						.select()
						.from(pluggyItems)
						.where(
							and(
								eq(pluggyItems.id, account.pluggyItemId),
								eq(pluggyItems.userId, session.user.id),
							),
						)
						.limit(1)
						.then((r) => r[0]);

					if (!item) return reply.send([]);

					const transactions = await transactionsBase()
						.where(
							and(
								isNull(pluggyTransactions.hiddenAt),
								eq(pluggyTransactions.pluggyAccountId, account.id),
								eq(pluggyItems.userId, session.user.id),
							),
						)
						.orderBy(desc(pluggyTransactions.date))
						.limit(limit);
					return reply.send(transactions);
				}

				const userItems = await db
					.select({
						id: pluggyItems.id,
					})
					.from(pluggyItems)
					.where(eq(pluggyItems.userId, session.user.id));
				if (userItems.length === 0) return reply.send([]);

				const transactions = await transactionsBase()
					.where(
						and(
							isNull(pluggyTransactions.hiddenAt),
							eq(pluggyItems.userId, session.user.id),
						),
					)
					.orderBy(desc(pluggyTransactions.date))
					.limit(limit);
				return reply.send(transactions);
			} catch (error) {
				return sendKnownError(reply, error);
			}
		},
	});
}
