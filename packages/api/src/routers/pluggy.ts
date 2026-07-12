import type { FastifyInstance } from "fastify";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { PluggyAuthError } from "../clients/pluggy";
import { db } from "../db";
import { pluggyItems, pluggyTransactions } from "../db/schema";
import { requireSession } from "../index";
import {
	MissingPluggyCredentialsError,
	resolvePluggyCredentials,
} from "../services/connectors/credentials";
import {
	createPluggyService,
	persistPluggyItemAndSync,
	syncTransactionsForItem,
} from "../services/pluggy";

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
				const token = await pluggy.createConnectToken({
					clientUserId: session.user.id,
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

	server.route({
		method: "POST",
		url: "/sync/:itemId",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const { itemId } = z
					.object({ itemId: z.string() })
					.parse(req.params);

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
					localItemId: item.id,
					pluggyItemId: item.pluggyItemId,
				});

				return reply.send({ itemId: item.id, sync });
			} catch (error) {
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
				await pluggy.deleteItem(item.pluggyItemId);
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
				const query = req.query as { limit?: string; itemId?: string };
				const limit = Number(query.limit) ?? 20;

				let transactions;
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

					transactions = await db
						.select({
							id: pluggyTransactions.id,
							pluggyTransactionId: pluggyTransactions.pluggyTransactionId,
							date: pluggyTransactions.date,
							amount: pluggyTransactions.amount,
							description: pluggyTransactions.description,
							category: pluggyTransactions.category,
							provider: pluggyItems.provider,
						})
						.from(pluggyTransactions)
						.innerJoin(
							pluggyItems,
							eq(pluggyTransactions.pluggyItemId, pluggyItems.id),
						)
						.where(eq(pluggyItems.id, item.id))
						.orderBy(desc(pluggyTransactions.date))
						.limit(limit);
				} else {
					const userItems = await db
						.select({
							id: pluggyItems.id,
							pluggyItemId: pluggyItems.pluggyItemId,
							provider: pluggyItems.provider,
						})
						.from(pluggyItems)
						.where(eq(pluggyItems.userId, session.user.id));
					if (userItems.length === 0) return reply.send([]);

					transactions = await db
						.select({
							id: pluggyTransactions.id,
							pluggyTransactionId: pluggyTransactions.pluggyTransactionId,
							date: pluggyTransactions.date,
							amount: pluggyTransactions.amount,
							description: pluggyTransactions.description,
							category: pluggyTransactions.category,
							provider: pluggyItems.provider,
						})
						.from(pluggyTransactions)
						.innerJoin(
							pluggyItems,
							eq(pluggyTransactions.pluggyItemId, pluggyItems.id),
						)
						.where(eq(pluggyItems.userId, session.user.id))
						.orderBy(desc(pluggyTransactions.date))
						.limit(limit);
				}
				return reply.send(transactions);
			} catch (error) {
				return sendKnownError(reply, error);
			}
		},
	});
}
