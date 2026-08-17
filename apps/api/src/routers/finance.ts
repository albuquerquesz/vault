import {
	and,
	asc,
	desc,
	eq,
	gte,
	inArray,
	isNull,
	lte,
	not,
	notInArray,
	or,
	sql,
	sum,
} from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../db/index.js";
import {
	expense,
	goal,
	monthlyBill,
	monthlyBillItem,
	monthlyBudget,
	monthlySpendingGoal,
	pluggyAccounts,
	pluggyItems,
	pluggyTransactions,
	savingsTarget,
} from "../db/schema/index.js";
import {
	PLUGGY_IGNORED_EXPENSE_CATEGORIES,
	rebuildExpensesFromStoredTransactions,
} from "../services/pluggy.js";
import { calculateMonthlySpendingGoal } from "../services/monthly-spending-goal.js";
import { requireSession } from "../session.js";

const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;

const expenseInput = z.object({
	date: z.iso.date(),
	amount: z.number().positive(),
	category: z.string().trim().min(1).max(64),
	note: z.string().trim().max(280).optional(),
});

const manualTransactionInput = expenseInput.extend({
	kind: z.enum(["expense", "income"]),
});

const transactionIdsInput = z.object({
	ids: z.array(z.string().uuid()).min(1).max(100),
});

function getMonthBounds(month: string) {
	const start = `${month}-01`;
	const endDate = new Date(`${month}-01T00:00:00.000Z`);
	endDate.setUTCMonth(endDate.getUTCMonth() + 1);
	endDate.setUTCDate(0);
	return { start, end: endDate.toISOString().slice(0, 10) };
}

function getPreviousMonthValue(month: string) {
	const [year, monthNumber] = month.split("-").map(Number);
	if (!year || !monthNumber) {
		return month;
	}

	const date = new Date(year, monthNumber - 2, 1);
	const previousYear = date.getFullYear();
	const previousMonth = String(date.getMonth() + 1).padStart(2, "0");
	return `${previousYear}-${previousMonth}`;
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
		eq(expense.kind, "expense"),
		or(
			not(eq(expense.source, "pluggy")),
			notInArray(expense.category, [...PLUGGY_IGNORED_EXPENSE_CATEGORIES]),
		),
	);
}

function buildManualExpensesWhere(params: {
	userId: string;
	start: string;
	end: string;
}) {
	const { userId, start, end } = params;

	return and(
		eq(expense.userId, userId),
		gte(expense.expenseDate, start),
		lte(expense.expenseDate, end),
		not(eq(expense.source, "pluggy")),
	);
}

function buildVisiblePluggyTransactionsWhere(params: {
	userId: string;
	start: string;
	end: string;
}) {
	const { userId, start, end } = params;

	return and(
		eq(pluggyItems.userId, userId),
		gte(pluggyTransactions.date, start),
		lte(pluggyTransactions.date, end),
		isNull(pluggyTransactions.hiddenAt),
		or(
			sql`${pluggyTransactions.category} is null`,
			notInArray(
				pluggyTransactions.category,
				[...PLUGGY_IGNORED_EXPENSE_CATEGORIES],
			),
		),
	);
}

type FinanceTransactionRecord = {
	id: string;
	date: string;
	amount: number;
	category: string;
	description: string | null;
	source: "cash" | "pluggy";
	sourceExternalId: string | null;
	sourceItemId: string | null;
	sourceProvider: string | null;
	sourceAccountName: string | null;
	sourceAccountType: string | null;
	sourceAccountSubtype: string | null;
	sourceAccountBrand: string | null;
	createdAt: Date;
	updatedAt: Date | null;
	kind: "income" | "expense";
	isDeletable: boolean;
	isHideable: boolean;
};

async function listFinanceTransactions(params: {
	userId: string;
	month: string;
}) {
	const { userId, month } = params;
	const { start, end } = getMonthBounds(month);

	const [manualExpenses, pluggyRows] = await Promise.all([
		db
			.select()
			.from(expense)
			.where(buildManualExpensesWhere({ userId, start, end }))
			.orderBy(desc(expense.expenseDate), desc(expense.createdAt)),
		db
			.select({
				id: pluggyTransactions.id,
				date: pluggyTransactions.date,
				amount: sql<number>`${pluggyTransactions.amount}`.mapWith(Number),
				description: pluggyTransactions.description,
				category: pluggyTransactions.category,
				sourceItemId: pluggyTransactions.pluggyItemId,
				sourceProvider: pluggyItems.provider,
				sourceAccountName: pluggyAccounts.name,
				sourceAccountType: pluggyAccounts.type,
				sourceAccountSubtype: pluggyAccounts.subtype,
				sourceAccountBrand: pluggyAccounts.brand,
				createdAt: sql<Date>`coalesce(${pluggyTransactions.createdAt}, now())`.mapWith(
					Date,
				),
			})
			.from(pluggyTransactions)
			.innerJoin(pluggyItems, eq(pluggyTransactions.pluggyItemId, pluggyItems.id))
			.leftJoin(
				pluggyAccounts,
				eq(pluggyTransactions.pluggyAccountId, pluggyAccounts.id),
			)
			.where(buildVisiblePluggyTransactionsWhere({ userId, start, end }))
			.orderBy(desc(pluggyTransactions.date), desc(pluggyTransactions.createdAt)),
	]);

	const transactions = [
		...pluggyRows.map<FinanceTransactionRecord>((row) => ({
			id: row.id,
			date: row.date,
			amount: row.amount,
			category: row.category?.trim() || "Outros",
			description: row.description ?? null,
			source: "pluggy",
			sourceExternalId: null,
			sourceItemId: row.sourceItemId,
			sourceProvider: row.sourceProvider,
			sourceAccountName: row.sourceAccountName,
			sourceAccountType: row.sourceAccountType,
			sourceAccountSubtype: row.sourceAccountSubtype,
			sourceAccountBrand: row.sourceAccountBrand,
				createdAt: new Date(row.createdAt),
			updatedAt: null,
			kind: row.amount < 0 ? "expense" : "income",
			isDeletable: false,
			isHideable: row.amount < 0,
		})),
		...manualExpenses.map<FinanceTransactionRecord>((row) => ({
			id: row.id,
			date: row.expenseDate,
			amount: row.kind === "income" ? Number(row.amount) : -Number(row.amount),
			category: row.category,
			description: row.note ?? null,
			source: "cash",
			sourceExternalId: row.sourceExternalId ?? null,
			sourceItemId: row.sourceItemId ?? null,
			sourceProvider: row.sourceProvider ?? null,
			sourceAccountName: row.sourceAccountName ?? null,
			sourceAccountType: row.sourceAccountType ?? null,
			sourceAccountSubtype: row.sourceAccountSubtype ?? null,
			sourceAccountBrand: row.sourceAccountBrand ?? null,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
			kind: row.kind === "income" ? "income" : "expense",
			isDeletable: true,
			isHideable: false,
		})),
	];

	return transactions.sort((left, right) => {
		const dateDiff = right.date.localeCompare(left.date);
		if (dateDiff !== 0) {
			return dateDiff;
		}

		const updatedDiff =
			(right.updatedAt ?? right.createdAt).getTime() -
			(left.updatedAt ?? left.createdAt).getTime();
		if (updatedDiff !== 0) {
			return updatedDiff;
		}

		return right.createdAt.getTime() - left.createdAt.getTime();
	});
}

async function getPartialResultMetrics(params: {
	userId: string;
	month: string;
}) {
	const { userId, month } = params;
	const { start, end } = getMonthBounds(month);

	const [manualExpensesResult, manualIncomeResult, pluggyTransactionsResult] = await Promise.all([
		db
			.select({ totalSpent: sum(expense.amount).mapWith(Number) })
			.from(expense)
			.where(and(buildManualExpensesWhere({ userId, start, end }), eq(expense.kind, "expense")))
			.limit(1)
			.then((rows) => rows[0]),
		db
			.select({ totalIncome: sum(expense.amount).mapWith(Number) })
			.from(expense)
			.where(and(buildManualExpensesWhere({ userId, start, end }), eq(expense.kind, "income")))
			.limit(1)
			.then((rows) => rows[0]),
		db
			.select({
				amount: sql<number>`${pluggyTransactions.amount}`.mapWith(Number),
			})
			.from(pluggyTransactions)
			.innerJoin(pluggyItems, eq(pluggyTransactions.pluggyItemId, pluggyItems.id))
			.where(buildVisiblePluggyTransactionsWhere({ userId, start, end })),
	]);

	let income = 0;
	let pluggySpent = 0;

	for (const transaction of pluggyTransactionsResult) {
		const amount = transaction.amount;
		if (amount > 0) {
			income += amount;
			continue;
		}

		if (amount < 0) {
			pluggySpent += Math.abs(amount);
		}
	}

	const spent = pluggySpent + (manualExpensesResult?.totalSpent ?? 0);
	const totalIncome = income + (manualIncomeResult?.totalIncome ?? 0);
	const result = totalIncome - spent;

	return {
		income: totalIncome,
		spent,
		result,
	};
}

async function getMonthlySpent(params: {
	userId: string;
	start: string;
	end: string;
}) {
	const { userId, start, end } = params;
	const [manualExpensesResult, pluggyTransactionsResult] = await Promise.all([
		db
			.select({ totalSpent: sum(expense.amount).mapWith(Number) })
			.from(expense)
			.where(and(buildManualExpensesWhere({ userId, start, end }), eq(expense.kind, "expense")))
			.limit(1)
			.then((rows) => rows[0]),
		db
			.select({ amount: sql<number>`${pluggyTransactions.amount}`.mapWith(Number) })
			.from(pluggyTransactions)
			.innerJoin(pluggyItems, eq(pluggyTransactions.pluggyItemId, pluggyItems.id))
			.where(buildVisiblePluggyTransactionsWhere({ userId, start, end })),
	]);

	const pluggySpent = pluggyTransactionsResult.reduce(
		(total, transaction) => total + (transaction.amount < 0 ? Math.abs(transaction.amount) : 0),
		0,
	);

	return (manualExpensesResult?.totalSpent ?? 0) + pluggySpent;
}

function getRemainingDaysInMonth(month: string, today: string) {
	const { start, end } = getMonthBounds(month);
	if (today < start) {
		return Math.round(
			(Date.parse(end) - Date.parse(start)) / (1000 * 60 * 60 * 24),
		) + 1;
	}
	if (today > end) return 0;
	return Math.round((Date.parse(end) - Date.parse(today)) / (1000 * 60 * 60 * 24)) + 1;
}

function serializeExpense(r: typeof expense.$inferSelect) {
	return { ...r, amount: Number(r.amount) };
}
function serializeMonthlyBudget(r: typeof monthlyBudget.$inferSelect) {
	return { ...r, income: Number(r.income) };
}
function serializeMonthlySpendingGoal(
	r: typeof monthlySpendingGoal.$inferSelect,
) {
	return { ...r, targetAmount: Number(r.targetAmount) };
}
function serializeGoal(r: typeof goal.$inferSelect) {
	return {
		...r,
		targetAmount: Number(r.targetAmount),
		currentAmount: Number(r.currentAmount),
	};
}

/** Empty string / null → null; omit field → undefined (leave unchanged on PATCH). */
const optionalGoalUrl = z
	.union([z.string().trim().url().max(2048), z.literal(""), z.null()])
	.optional()
	.transform((value) => {
		if (value === undefined) return undefined;
		if (value === "" || value === null) return null;
		return value;
	});
function serializeMonthlyBill(r: typeof monthlyBill.$inferSelect) {
	return { ...r, totalBill: Number(r.totalBill) };
}
function serializeMonthlyBillItem(r: typeof monthlyBillItem.$inferSelect) {
	return {
		...r,
		paidAmount: Number(r.paidAmount),
		totalAmount: Number(r.totalAmount),
	};
}
function serializeSavingsTarget(r: typeof savingsTarget.$inferSelect) {
	return { ...r, savingsPercentage: Number(r.savingsPercentage) };
}

export function registerFinanceRoutes(server: FastifyInstance) {
	server.route({
		method: "GET",
		url: "/transactions",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const month = (req.query as { month: string }).month;
				if (!monthPattern.test(month))
					return reply
						.status(400)
						.send({ error: "Invalid month format. Use YYYY-MM" });

				const records = await listFinanceTransactions({
					userId: session.user.id,
					month,
				});
				return reply.send(records);
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send({ error: "Authentication required" });
				throw error;
			}
		},
	});

	server.route({
		method: "GET",
		url: "/expenses",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const month = (req.query as { month: string }).month;
				if (!monthPattern.test(month))
					return reply
						.status(400)
						.send({ error: "Invalid month format. Use YYYY-MM" });
				const { start, end } = getMonthBounds(month);
				const records = await db
					.select()
					.from(expense)
					.where(
						buildVisibleExpensesWhere({ userId: session.user.id, start, end }),
					)
					.orderBy(desc(expense.expenseDate), desc(expense.createdAt));
				return reply.send(records.map(serializeExpense));
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send({ error: "Authentication required" });
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
				const [record] = await db
					.insert(expense)
					.values({
						userId: session.user.id,
						expenseDate: input.date,
						amount: input.amount.toString(),
						kind: "expense",
						source: "cash",
						category: input.category,
						note: input.note ?? null,
					})
					.returning();
				return reply.code(201).send(serializeExpense(record!));
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send({ error: "Authentication required" });
				if (error instanceof z.ZodError)
					return reply.status(400).send({ error: error.message });
				throw error;
			}
		},
	});

	server.route({
		method: "POST",
		url: "/transactions/manual",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const input = manualTransactionInput.parse(req.body);
				const [record] = await db
					.insert(expense)
					.values({
						userId: session.user.id,
						expenseDate: input.date,
						amount: input.amount.toString(),
						kind: input.kind,
						source: "cash",
						category: input.category,
						note: input.note ?? null,
					})
					.returning();
				return reply.code(201).send(serializeExpense(record!));
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send({ error: "Authentication required" });
				if (error instanceof z.ZodError)
					return reply.status(400).send({ error: error.message });
				throw error;
			}
		},
	});

	server.route({
		method: "DELETE",
		url: "/expenses",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const { ids } = z
					.object({
						ids: z.array(z.string().uuid()).min(1).max(100),
					})
					.parse(req.body);

				const deleted = await db
					.delete(expense)
					.where(
						and(
							eq(expense.userId, session.user.id),
							not(eq(expense.source, "pluggy")),
							inArray(expense.id, ids),
						),
					)
					.returning({ id: expense.id });

				return reply.send({ deleted: deleted.length });
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send({ error: "Authentication required" });
				if (error instanceof z.ZodError)
					return reply.status(400).send({ error: error.message });
				throw error;
			}
		},
	});

	server.route({
		method: "POST",
		url: "/transactions/hide",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const { ids } = transactionIdsInput.parse(req.body);

				const ownedTransactions = await db
					.select({
						id: pluggyTransactions.id,
						pluggyItemId: pluggyTransactions.pluggyItemId,
						amount: sql<number>`${pluggyTransactions.amount}`.mapWith(Number),
					})
					.from(pluggyTransactions)
					.innerJoin(
						pluggyItems,
						eq(pluggyTransactions.pluggyItemId, pluggyItems.id),
					)
					.where(
						and(
							eq(pluggyItems.userId, session.user.id),
							inArray(pluggyTransactions.id, ids),
						),
					);

				const hideableIds = ownedTransactions
					.filter((row) => row.amount < 0)
					.map((row) => row.id);
				const itemIds = Array.from(
					new Set(
						ownedTransactions
							.filter((row) => row.amount < 0)
							.map((row) => row.pluggyItemId),
					),
				);

				if (hideableIds.length === 0) {
					return reply.send({ hidden: 0 });
				}

				const hidden = await db
					.update(pluggyTransactions)
					.set({ hiddenAt: new Date() })
					.where(inArray(pluggyTransactions.id, hideableIds))
					.returning({ id: pluggyTransactions.id });

				await Promise.all(
					itemIds.map((localItemId) =>
						rebuildExpensesFromStoredTransactions({
							userId: session.user.id,
							localItemId,
						}),
					),
				);

				return reply.send({ hidden: hidden.length });
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send({ error: "Authentication required" });
				if (error instanceof z.ZodError)
					return reply.status(400).send({ error: error.message });
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
				const { month, income } = z
					.object({
						month: z.string().regex(monthPattern),
						income: z.number().positive(),
					})
					.parse(req.body);
				const [record] = await db
					.insert(monthlyBudget)
					.values({
						userId: session.user.id,
						month,
						income: income.toString(),
					})
					.onConflictDoUpdate({
						target: [monthlyBudget.userId, monthlyBudget.month],
						set: { income: income.toString() },
					})
					.returning();
				return reply.send(serializeMonthlyBudget(record!));
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send({ error: "Authentication required" });
				if (error instanceof z.ZodError)
					return reply.status(400).send({ error: error.message });
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
				if (!monthPattern.test(query.month))
					return reply
						.status(400)
						.send({ error: "Invalid month format. Use YYYY-MM" });
				const { start, end } = getMonthBounds(query.month);
				const budget = await db
					.select()
					.from(monthlyBudget)
					.where(
						and(
							eq(monthlyBudget.userId, session.user.id),
							eq(monthlyBudget.month, query.month),
						),
					)
					.limit(1)
					.then((r) => r[0]);
				if (!budget)
					return reply.send({
						month: query.month,
						income: 0,
						spent: 0,
						spentPercentage: 0,
						remainingBudget: 0,
						remainingDays: 0,
						dailyCap: 0,
					});
				const income = Number(budget.income);
				const result = await db
					.select({ totalSpent: sum(expense.amount).mapWith(Number) })
					.from(expense)
					.where(
						buildVisibleExpensesWhere({ userId: session.user.id, start, end }),
					)
					.limit(1)
					.then((r) => r[0]);
				const spent = result?.totalSpent ?? 0;
				const remainingBudget = Math.max(0, income - spent);
				const todayDate = query.today ? new Date(query.today) : new Date();
				const endOfMonth = new Date(end);
				const remainingDays = Math.max(
					0,
					Math.ceil(
						(endOfMonth.getTime() - todayDate.getTime()) /
							(1000 * 60 * 60 * 24),
					),
				);
				return reply.send({
					month: query.month,
					income,
					spent,
					spentPercentage: (spent / income) * 100,
					remainingBudget,
					remainingDays,
					dailyCap: remainingDays > 0 ? remainingBudget / remainingDays : 0,
				});
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send({ error: "Authentication required" });
				throw error;
			}
		},
	});

	server.route({
		method: "GET",
		url: "/spending-goal",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const query = req.query as { month?: string; today?: string };
				const month = query.month;
				if (!month || !monthPattern.test(month)) {
					return reply
						.status(400)
						.send({ error: "Invalid month format. Use YYYY-MM" });
				}
				const today = query.today ?? new Date().toISOString().slice(0, 10);
				if (
					!/^\d{4}-\d{2}-\d{2}$/.test(today) ||
					Number.isNaN(Date.parse(today)) ||
					new Date(`${today}T00:00:00.000Z`).toISOString().slice(0, 10) !== today
				) {
					return reply
						.status(400)
						.send({ error: "Invalid today format. Use YYYY-MM-DD" });
				}

				const [record, spent] = await Promise.all([
					db
					.select()
					.from(monthlySpendingGoal)
					.where(
						and(
							eq(monthlySpendingGoal.userId, session.user.id),
							eq(monthlySpendingGoal.month, month),
						),
					)
					.limit(1)
					.then((rows) => rows[0]),
					(async () => {
						const bounds = getMonthBounds(month);
						return getMonthlySpent({ userId: session.user.id, ...bounds });
					})(),
				]);
				const remainingDays = getRemainingDaysInMonth(month, today);
				const targetAmount = record ? Number(record.targetAmount) : null;
				const calculation = calculateMonthlySpendingGoal({
					targetAmount,
					spent,
					remainingDays,
				});

				return reply.send({
					month,
					targetAmount,
					spent,
					remainingAmount: calculation.remainingAmount,
					remainingDays,
					dailyLimit: calculation.dailyLimit,
					isOverTarget: calculation.isOverTarget,
				});
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send({ error: "Authentication required" });
				throw error;
			}
		},
	});

	server.route({
		method: "POST",
		url: "/spending-goal",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const { month, targetAmount } = z
					.object({
						month: z.string().regex(monthPattern),
						targetAmount: z.number().positive(),
					})
					.parse(req.body);

				const [record] = await db
					.insert(monthlySpendingGoal)
					.values({
						userId: session.user.id,
						month,
						targetAmount: targetAmount.toString(),
					})
					.onConflictDoUpdate({
						target: [monthlySpendingGoal.userId, monthlySpendingGoal.month],
						set: { targetAmount: targetAmount.toString() },
					})
					.returning();

				return reply.send(serializeMonthlySpendingGoal(record!));
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send({ error: "Authentication required" });
				if (error instanceof z.ZodError)
					return reply.status(400).send({ error: error.message });
				throw error;
			}
		},
	});

	server.route({
		method: "GET",
		url: "/partial-result",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const query = req.query as { month: string };
				if (!monthPattern.test(query.month))
					return reply
						.status(400)
						.send({ error: "Invalid month format. Use YYYY-MM" });

				const previousMonth = getPreviousMonthValue(query.month);
				const [currentMonthMetrics, previousMonthMetrics] = await Promise.all([
					getPartialResultMetrics({
						userId: session.user.id,
						month: query.month,
					}),
					getPartialResultMetrics({
						userId: session.user.id,
						month: previousMonth,
					}),
				]);

				const changePercent =
					previousMonthMetrics.result === 0
						? null
						: ((currentMonthMetrics.result - previousMonthMetrics.result) /
								Math.abs(previousMonthMetrics.result)) *
							100;

				return reply.send({
					month: query.month,
					income: currentMonthMetrics.income,
					spent: currentMonthMetrics.spent,
					result: currentMonthMetrics.result,
					previousResult: previousMonthMetrics.result,
					changePercent,
				});
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send({ error: "Authentication required" });
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
				const records = await db
					.select()
					.from(goal)
					.where(eq(goal.userId, session.user.id))
					.orderBy(asc(goal.createdAt));
				return reply.send(records.map(serializeGoal));
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send({ error: "Authentication required" });
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
				const { name, targetAmount, currentAmount, url } = z
					.object({
						name: z.string().trim().min(1).max(128),
						targetAmount: z.number().positive(),
						currentAmount: z.number().min(0).default(0),
						url: optionalGoalUrl,
					})
					.parse(req.body);
				const [record] = await db
					.insert(goal)
					.values({
						userId: session.user.id,
						name,
						url,
						targetAmount: targetAmount.toString(),
						currentAmount: (currentAmount ?? 0).toString(),
					})
					.returning();
				return reply.code(201).send(serializeGoal(record!));
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send({ error: "Authentication required" });
				if (error instanceof z.ZodError)
					return reply.status(400).send({ error: error.message });
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
				const body = z
					.object({
						name: z.string().trim().min(1).max(128).optional(),
						targetAmount: z.number().positive().optional(),
						currentAmount: z.number().min(0).optional(),
						url: optionalGoalUrl,
					})
					.refine(
						(data) =>
							data.name !== undefined ||
							data.targetAmount !== undefined ||
							data.currentAmount !== undefined ||
							data.url !== undefined,
						{ message: "At least one field is required" },
					)
					.parse(req.body);
				const existing = await db
					.select()
					.from(goal)
					.where(and(eq(goal.id, id), eq(goal.userId, session.user.id)))
					.limit(1)
					.then((r) => r[0]);
				if (!existing)
					return reply.status(404).send({ error: "Goal not found" });
				const [record] = await db
					.update(goal)
					.set({
						...(body.name !== undefined ? { name: body.name } : {}),
						...(body.targetAmount !== undefined
							? { targetAmount: body.targetAmount.toString() }
							: {}),
						...(body.currentAmount !== undefined
							? { currentAmount: body.currentAmount.toString() }
							: {}),
						...(body.url !== undefined ? { url: body.url } : {}),
					})
					.where(eq(goal.id, id))
					.returning();
				return reply.send(serializeGoal(record!));
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send({ error: "Authentication required" });
				if (error instanceof z.ZodError)
					return reply.status(400).send({ error: error.message });
				throw error;
			}
		},
	});

	server.route({
		method: "DELETE",
		url: "/goals/:id",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const { id } = z.object({ id: z.string() }).parse(req.params);
				const existing = await db
					.select()
					.from(goal)
					.where(and(eq(goal.id, id), eq(goal.userId, session.user.id)))
					.limit(1)
					.then((r) => r[0]);
				if (!existing)
					return reply.status(404).send({ error: "Goal not found" });
				await db.delete(goal).where(eq(goal.id, id));
				return reply.status(204).send();
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send({ error: "Authentication required" });
				if (error instanceof z.ZodError)
					return reply.status(400).send({ error: error.message });
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
				if (!monthPattern.test(month))
					return reply
						.status(400)
						.send({ error: "Invalid month format. Use YYYY-MM" });
				const bills = await db
					.select()
					.from(monthlyBill)
					.where(
						and(
							eq(monthlyBill.userId, session.user.id),
							eq(monthlyBill.month, month),
						),
					);
				if (bills.length === 0) {
					return reply.send({ bills: [], items: [] });
				}
				const items = await Promise.all(
					bills.map(async (bill) => {
						const billItems = await db
							.select()
							.from(monthlyBillItem)
							.where(eq(monthlyBillItem.monthlyBillId, bill.id))
							.orderBy(asc(monthlyBillItem.sortOrder));
						return billItems.map(serializeMonthlyBillItem);
					}),
				);
				return reply.send({
					bills: bills.map(serializeMonthlyBill),
					items: items.flat(),
				});
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send({ error: "Authentication required" });
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
				const month =
					(req.query as { month?: string }).month ||
					new Date().toISOString().slice(0, 7);

				if (!monthPattern.test(month)) {
					return reply
						.status(400)
						.send({ error: "Invalid month format. Use YYYY-MM" });
				}

				const [result] = await db
					.select()
					.from(savingsTarget)
					.where(
						and(
							eq(savingsTarget.userId, session.user.id),
							eq(savingsTarget.month, month),
						),
					);

				if (!result) {
					return reply.send({ month, savingsPercentage: null });
				}

				return reply.send(serializeSavingsTarget(result));
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send({ error: "Authentication required" });
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
					return reply
						.status(400)
						.send({ error: "Invalid month format. Use YYYY-MM" });
				}

				const percentage = body.savingsPercentage;
				if (
					typeof percentage !== "number" ||
					percentage < 0 ||
					percentage > 100
				) {
					return reply
						.status(400)
						.send({ error: "savingsPercentage must be between 0 and 100" });
				}

				const existing = await db
					.select({ id: savingsTarget.id })
					.from(savingsTarget)
					.where(
						and(
							eq(savingsTarget.userId, session.user.id),
							eq(savingsTarget.month, body.month),
						),
					);

				const existingId = existing[0]?.id;
				if (existingId) {
					await db
						.update(savingsTarget)
						.set({ savingsPercentage: String(percentage) })
						.where(eq(savingsTarget.id, existingId));
					return reply.send({
						month: body.month,
						savingsPercentage: percentage,
					});
				}

				await db.insert(savingsTarget).values({
					userId: session.user.id,
					month: body.month,
					savingsPercentage: String(percentage),
				});

				return reply.send({ month: body.month, savingsPercentage: percentage });
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send({ error: "Authentication required" });
				throw error;
			}
		},
	});
}
