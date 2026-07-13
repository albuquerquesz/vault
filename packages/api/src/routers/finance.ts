import type { FastifyInstance } from "fastify";
import { and, asc, desc, eq, gte, inArray, lte, not, or, sum } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { expense, goal, monthlyBill, monthlyBillItem, monthlyBudget, savingsTarget } from "../db/schema";
import { requireSession } from "../index";
import {
	PLUGGY_IGNORED_EXPENSE_CATEGORIES,
} from "../services/pluggy";

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
	return { start, end: endDate.toISOString().slice(0, 10) };
}

function buildVisibleExpensesWhere(params: {
	userId: string;
	start: string;
	end: string;
}) {
	const { userId, start, end } = params;

	return and(
		eq(expense.userId, userId),
		gte(expense.expenseDate, start),
		lte(expense.expenseDate, end),
		or(
			not(eq(expense.source, "pluggy")),
			not(inArray(expense.category, [...PLUGGY_IGNORED_EXPENSE_CATEGORIES])),
		),
	);
}

function serializeExpense(r: typeof expense.$inferSelect) { return { ...r, amount: Number(r.amount) }; }
function serializeMonthlyBudget(r: typeof monthlyBudget.$inferSelect) { return { ...r, income: Number(r.income) }; }
function serializeGoal(r: typeof goal.$inferSelect) { return { ...r, targetAmount: Number(r.targetAmount), currentAmount: Number(r.currentAmount) }; }
function serializeMonthlyBill(r: typeof monthlyBill.$inferSelect) { return { ...r, totalBill: Number(r.totalBill) }; }
function serializeMonthlyBillItem(r: typeof monthlyBillItem.$inferSelect) { return { ...r, paidAmount: Number(r.paidAmount), totalAmount: Number(r.totalAmount) }; }
function serializeSavingsTarget(r: typeof savingsTarget.$inferSelect) { return { ...r, savingsPercentage: Number(r.savingsPercentage) }; }

export function registerFinanceRoutes(server: FastifyInstance) {

	server.route({
		method: "GET",
		url: "/expenses",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const month = (req.query as { month: string }).month;
				if (!monthPattern.test(month)) return reply.status(400).send({ error: "Invalid month format. Use YYYY-MM" });
				const { start, end } = getMonthBounds(month);
				const records = await db.select().from(expense)
					.where(buildVisibleExpensesWhere({ userId: session.user.id, start, end }))
					.orderBy(desc(expense.expenseDate), desc(expense.createdAt));
				return reply.send(records.map(serializeExpense));
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401) return reply.status(401).send({ error: "Authentication required" });
				throw error;
			}
		},
	});

	server.route({
		method: "POST",
		url: "/expenses",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const input = expenseInput.parse(req.body);
				const [record] = await db.insert(expense).values({
					userId: session.user.id, expenseDate: input.date, amount: input.amount.toString(),
					category: input.category, note: input.note ?? null,
				}).returning();
				return reply.code(201).send(serializeExpense(record!));
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401) return reply.status(401).send({ error: "Authentication required" });
				if (error instanceof z.ZodError) return reply.status(400).send({ error: error.message });
				throw error;
			}
		},
	});

	server.route({
		method: "POST",
		url: "/budget",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const { month, income } = z.object({ month: z.string().regex(monthPattern), income: z.number().positive() }).parse(req.body);
				const [record] = await db.insert(monthlyBudget).values({
					userId: session.user.id, month, income: income.toString(),
				}).onConflictDoUpdate({ target: [monthlyBudget.userId, monthlyBudget.month], set: { income: income.toString() } }).returning();
				return reply.send(serializeMonthlyBudget(record!));
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401) return reply.status(401).send({ error: "Authentication required" });
				if (error instanceof z.ZodError) return reply.status(400).send({ error: error.message });
				throw error;
			}
		},
	});

	server.route({
		method: "GET",
		url: "/overview",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const query = req.query as { month: string; today?: string };
				if (!monthPattern.test(query.month)) return reply.status(400).send({ error: "Invalid month format. Use YYYY-MM" });
				const { start, end } = getMonthBounds(query.month);
				const budget = await db.select().from(monthlyBudget)
					.where(and(eq(monthlyBudget.userId, session.user.id), eq(monthlyBudget.month, query.month)))
					.limit(1).then(r => r[0]);
				if (!budget) return reply.send({ month: query.month, income: 0, spent: 0, spentPercentage: 0, remainingBudget: 0, remainingDays: 0, dailyCap: 0 });
				const income = Number(budget.income);
				const result = await db.select({ totalSpent: sum(expense.amount).mapWith(Number) })
					.from(expense).where(buildVisibleExpensesWhere({ userId: session.user.id, start, end }))
					.limit(1).then(r => r[0]);
				const spent = result?.totalSpent ?? 0;
				const remainingBudget = Math.max(0, income - spent);
				const todayDate = query.today ? new Date(query.today) : new Date();
				const endOfMonth = new Date(end);
				const remainingDays = Math.max(0, Math.ceil((endOfMonth.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)));
				return reply.send({ month: query.month, income, spent, spentPercentage: (spent / income) * 100, remainingBudget, remainingDays, dailyCap: remainingDays > 0 ? remainingBudget / remainingDays : 0 });
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401) return reply.status(401).send({ error: "Authentication required" });
				throw error;
			}
		},
	});

	server.route({
		method: "GET",
		url: "/goals",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const records = await db.select().from(goal).where(eq(goal.userId, session.user.id)).orderBy(asc(goal.createdAt));
				return reply.send(records.map(serializeGoal));
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401) return reply.status(401).send({ error: "Authentication required" });
				throw error;
			}
		},
	});

	server.route({
		method: "POST",
		url: "/goals",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const { name, targetAmount, currentAmount } = z.object({
					name: z.string().trim().min(1).max(128), targetAmount: z.number().positive(), currentAmount: z.number().min(0).default(0),
				}).parse(req.body);
				const [record] = await db.insert(goal).values({
					userId: session.user.id, name, targetAmount: targetAmount.toString(), currentAmount: (currentAmount ?? 0).toString(),
				}).returning();
				return reply.code(201).send(serializeGoal(record!));
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401) return reply.status(401).send({ error: "Authentication required" });
				if (error instanceof z.ZodError) return reply.status(400).send({ error: error.message });
				throw error;
			}
		},
	});

	server.route({
		method: "PATCH",
		url: "/goals/:id",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const { id } = z.object({ id: z.string() }).parse(req.params);
				const { currentAmount } = z.object({ currentAmount: z.number().min(0) }).parse(req.body);
				const existing = await db.select().from(goal).where(and(eq(goal.id, id), eq(goal.userId, session.user.id))).limit(1).then(r => r[0]);
				if (!existing) return reply.status(404).send({ error: "Goal not found" });
				const [record] = await db.update(goal).set({ currentAmount: currentAmount.toString() }).where(eq(goal.id, id)).returning();
				return reply.send(serializeGoal(record!));
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401) return reply.status(401).send({ error: "Authentication required" });
				if (error instanceof z.ZodError) return reply.status(400).send({ error: error.message });
				throw error;
			}
		},
	});

	server.route({
		method: "GET",
		url: "/monthly-bills",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const month = (req.query as { month: string }).month;
				if (!monthPattern.test(month)) return reply.status(400).send({ error: "Invalid month format. Use YYYY-MM" });
				const bills = await db.select().from(monthlyBill).where(and(eq(monthlyBill.userId, session.user.id), eq(monthlyBill.month, month)));
			if (bills.length === 0) {
				return reply.send({ bills: [], items: [] });
			}
				const items = await Promise.all(bills.map(async bill => {
					const billItems = await db.select().from(monthlyBillItem).where(eq(monthlyBillItem.monthlyBillId, bill.id)).orderBy(asc(monthlyBillItem.sortOrder));
					return billItems.map(serializeMonthlyBillItem);
				}));
				return reply.send({ bills: bills.map(serializeMonthlyBill), items: items.flat() });
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401) return reply.status(401).send({ error: "Authentication required" });
				throw error;
			}
		},
	});

	// --- Savings Target ---

	server.route({
		method: "GET",
		url: "/savings-target",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const month = (req.query as { month?: string }).month || new Date().toISOString().slice(0, 7);

				if (!monthPattern.test(month)) {
					return reply.status(400).send({ error: "Invalid month format. Use YYYY-MM" });
				}

				const [result] = await db
					.select()
					.from(savingsTarget)
					.where(and(eq(savingsTarget.userId, session.user.id), eq(savingsTarget.month, month)));

				if (!result) {
					return reply.send({ month, savingsPercentage: null });
				}

				return reply.send(serializeSavingsTarget(result));
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401) return reply.status(401).send({ error: "Authentication required" });
				throw error;
			}
		},
	});

	server.route({
		method: "POST",
		url: "/savings-target",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const body = req.body as { month: string; savingsPercentage: number };

				if (!monthPattern.test(body.month)) {
					return reply.status(400).send({ error: "Invalid month format. Use YYYY-MM" });
				}

				const percentage = body.savingsPercentage;
				if (typeof percentage !== "number" || percentage < 0 || percentage > 100) {
					return reply.status(400).send({ error: "savingsPercentage must be between 0 and 100" });
				}

				const existing = await db
					.select({ id: savingsTarget.id })
					.from(savingsTarget)
					.where(and(eq(savingsTarget.userId, session.user.id), eq(savingsTarget.month, body.month)));

				if (existing.length > 0) {
					await db
						.update(savingsTarget)
						.set({ savingsPercentage: String(percentage) })
						.where(eq(savingsTarget.id, existing[0]!.id!));
				} else {
					await db.insert(savingsTarget).values({
						userId: session.user.id,
						month: body.month,
						savingsPercentage: String(percentage),
					});
				}

				return reply.send({ month: body.month, savingsPercentage: percentage });
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401) return reply.status(401).send({ error: "Authentication required" });
				throw error;
			}
		},
	});
}
