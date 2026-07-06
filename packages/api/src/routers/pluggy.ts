import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { pluggyItems, pluggyTransactions } from "../db/schema";
import { protectedProcedure, router } from "../index";
import { type PluggyTransaction, pluggyService } from "../services/pluggy";

export const pluggyRouter = router({
	connectToken: protectedProcedure.mutation(async () => {
		const token = await pluggyService.createConnectToken();
		return token;
	}),

	listItems: protectedProcedure.query(async ({ ctx }) => {
		const items = await db
			.select()
			.from(pluggyItems)
			.where(eq(pluggyItems.userId, ctx.session.user.id));
		return items;
	}),

	syncTransactions: protectedProcedure
		.input(
			z.object({
				pluggyItemId: z.string(),
				startDate: z.string(),
				endDate: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const item = await db
				.select()
				.from(pluggyItems)
				.where(
					and(
						eq(pluggyItems.userId, ctx.session.user.id),
						eq(pluggyItems.id, input.pluggyItemId),
					),
				)
				.limit(1)
				.then((r) => r[0]);

			if (!item) {
				throw new Error("Item not found");
			}

			const transactions: PluggyTransaction[] =
				await pluggyService.getTransactions({
					itemId: item.pluggyItemId,
					startDate: input.startDate,
					endDate: input.endDate,
				});

			const results = [];
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
					results.push(result[0]);
				}
			}

			return { synced: results.length, total: transactions.length };
		}),

	deleteItem: protectedProcedure
		.input(
			z.object({
				pluggyItemId: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const item = await db
				.select()
				.from(pluggyItems)
				.where(
					and(
						eq(pluggyItems.userId, ctx.session.user.id),
						eq(pluggyItems.id, input.pluggyItemId),
					),
				)
				.limit(1)
				.then((r) => r[0]);

			if (!item) {
				throw new Error("Item not found");
			}

			await pluggyService.deleteItem(item.pluggyItemId);
			await db.delete(pluggyItems).where(eq(pluggyItems.id, item.id));
		}),

	listTransactions: protectedProcedure
		.input(
			z.object({
				limit: z.number().optional().default(20),
			}),
		)
		.query(async ({ ctx, input }) => {
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
				.where(eq(pluggyItems.userId, ctx.session.user.id))
				.orderBy(desc(pluggyTransactions.date))
				.limit(input.limit);
			return transactions;
		}),
});
