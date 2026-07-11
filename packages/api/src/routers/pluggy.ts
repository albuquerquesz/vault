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
	type PluggyTransaction,
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

	server.route({
		method: "POST",
		url: "/sync",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const { pluggyItemId, startDate, endDate } = z
					.object({
						pluggyItemId: z.string(),
						startDate: z.string(),
						endDate: z.string(),
					})
					.parse(req.body);
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
				const transactions: PluggyTransaction[] =
					await pluggy.getTransactions({
						itemId: item.pluggyItemId,
						startDate,
						endDate,
					});
				const results: (typeof pluggyTransactions.$inferInsert)[] = [];
				for (const tx of transactions) {
					const existing = await db
						.select({ id: pluggyTransactions.id })
						.from(pluggyTransactions)
						.where(
							and(
								eq(pluggyTransactions.pluggyItemId, item.id),
								eq(pluggyTransactions.pluggyTransactionId, tx.id),
							),
						)
						.limit(1);
					if (existing.length === 0) {
						const result = await db
							.insert(pluggyTransactions)
							.values({
								pluggyItemId: item.id,
								pluggyTransactionId: tx.id,
								date: tx.date,
								amount: tx.amount.toString(),
								description: tx.description ?? null,
								category: tx.category ?? null,
							})
							.returning();
						results.push(result[0]!);
					}
				}
				return reply.send({
					synced: results.length,
					total: transactions.length,
				});
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
				const query = req.query as { limit?: string };
				const limit = Number(query.limit) ?? 20;
				const userItems = await db
					.select({
						id: pluggyItems.id,
						pluggyItemId: pluggyItems.pluggyItemId,
						provider: pluggyItems.provider,
					})
					.from(pluggyItems)
					.where(eq(pluggyItems.userId, session.user.id));
				if (userItems.length === 0) return reply.send([]);
				const transactions = await db
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
				return reply.send(transactions);
			} catch (error) {
				return sendKnownError(reply, error);
			}
		},
	});
}
