import { and, eq, gte, lte, sum } from "drizzle-orm";
import { z } from "zod";
import { expense, monthlyBudget } from "../db/schema";
import { protectedProcedure, router } from "../index";

const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;

const expenseInput = z.object({
	date: z.iso.date(),
	amount: z.number().positive(),
	category: z.string().trim().min(1).max(64),
	note: z.string().trim().max(280).optional(),
});

function getMonthBounds(month: string) {
	const start = `${month}-01`;
	const endDate = new Date(`${month}-01T00:00:00.000Z`);
	endDate.setUTCMonth(endDate.getUTCMonth() + 1);
	endDate.setUTCDate(0);

	return {
		start,
		end: endDate.toISOString().slice(0, 10),
	};
}

function serializeExpense(record: typeof expense.$inferSelect) {
	return {
		...record,
		amount: Number(record.amount),
	};
}

function serializeMonthlyBudget(record: typeof monthlyBudget.$inferSelect) {
	return {
		...record,
		income: Number(record.income),
	};
}

export const financeRouter = router({
	listExpenses: protectedProcedure
		.input(
			z.object({
				month: z.string().regex(monthPattern),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { start, end } = getMonthBounds(input.month);

			const expenses = await ctx.db.query.expense.findMany({
				where: and(
					eq(expense.userId, ctx.session.user.id),
					gte(expense.expenseDate, start),
					lte(expense.expenseDate, end),
				),
				orderBy: (fields, operators) => [
					operators.desc(fields.expenseDate),
					operators.desc(fields.createdAt),
				],
			});

			return expenses.map(serializeExpense);
		}),
	createExpense: protectedProcedure
		.input(expenseInput)
		.mutation(async ({ ctx, input }) => {
			const [createdExpense] = await ctx.db
				.insert(expense)
				.values({
					userId: ctx.session.user.id,
					expenseDate: input.date,
					amount: input.amount.toFixed(2),
					category: input.category,
					note: input.note,
				})
				.returning();

			return serializeExpense(createdExpense);
		}),
	upsertMonthlyBudget: protectedProcedure
		.input(
			z.object({
				month: z.string().regex(monthPattern),
				income: z.number().positive(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [budget] = await ctx.db
				.insert(monthlyBudget)
				.values({
					userId: ctx.session.user.id,
					month: input.month,
					income: input.income.toFixed(2),
				})
				.onConflictDoUpdate({
					target: [monthlyBudget.userId, monthlyBudget.month],
					set: {
						income: input.income.toFixed(2),
						updatedAt: new Date(),
					},
				})
				.returning();

			return serializeMonthlyBudget(budget);
		}),
	getMonthlyOverview: protectedProcedure
		.input(
			z.object({
				month: z.string().regex(monthPattern),
				today: z.iso.date().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const budget = await ctx.db.query.monthlyBudget.findFirst({
				where: and(
					eq(monthlyBudget.userId, ctx.session.user.id),
					eq(monthlyBudget.month, input.month),
				),
			});

			const { start, end } = getMonthBounds(input.month);
			const [spentRow] = await ctx.db
				.select({
					total: sum(expense.amount),
				})
				.from(expense)
				.where(
					and(
						eq(expense.userId, ctx.session.user.id),
						gte(expense.expenseDate, start),
						lte(expense.expenseDate, end),
					),
				);

			const income = Number(budget?.income ?? 0);
			const spent = Number(spentRow?.total ?? 0);
			const remainingBudget = Math.max(0, income - spent);
			const today = input.today ?? new Date().toISOString().slice(0, 10);
			const todayDate = new Date(`${today}T00:00:00.000Z`);
			const monthEnd = new Date(`${end}T00:00:00.000Z`);
			const remainingDays =
				todayDate > monthEnd
					? 0
					: Math.max(
							1,
							Math.floor(
								(monthEnd.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24),
							) + 1,
						);

			return {
				month: input.month,
				income,
				spent,
				spentPercentage: income > 0 ? (spent / income) * 100 : 0,
				remainingBudget,
				remainingDays,
				dailyCap:
					remainingBudget > 0 && remainingDays > 0
						? remainingBudget / remainingDays
						: 0,
			};
		}),
});
