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
	sql,
	sum,
} from "drizzle-orm";
import type { RouteRegistrar } from "../hono/registrar.js";
import { z } from "zod";
import { db } from "../db/index.js";
import { errorBody, sendKnownError } from "../lib/http-errors.js";
import {
	billPaymentOverride,
	expense,
	goal,
	goalContribution,
	monthlyBill,
	monthlyBillItem,
	monthlyBudget,
	monthlyCategoryLimit,
	monthlySpendingGoal,
	pluggyAccounts,
	pluggyBills,
	pluggyItems,
	pluggyTransactions,
	recurringItem,
	recurringPayment,
	savingsTarget,
} from "../db/schema/index.js";
import { paidSource } from "../services/bill-payment.js";
import { calculateCategoryLimits } from "../services/category-limits.js";
import {
	addMonthsClamped,
	dateOnly,
	estimateOpenBill,
	openBillSince,
	summarizeLimit,
} from "../services/credit-cards.js";
import {
	activePlans,
	buildInstallmentPlans,
	projectUpcoming,
} from "../services/installments.js";
import { applyContribution, planGoal } from "../services/goal-plan.js";
import {
	buildOccurrences,
	isActiveIn,
	previousMonth,
	type RecurringItemRow,
	summarizeOccurrences,
} from "../services/recurring.js";
import {
	matchesTransactionSearch,
	normalizeText,
	paginate,
} from "../services/transaction-search.js";
import {
	materializeMonthlyBillsFromPluggy,
	rebuildExpensesFromStoredTransactions,
} from "../services/pluggy.js";
import {
	classifyPluggyTransactions,
	signedAmount,
} from "../services/pluggy-classification.js";
import {
	getPluggyTotals,
	loadClassifiedPluggyTransactions,
} from "../services/pluggy-ledger.js";
import { calculateMonthlySpendingGoal } from "../services/monthly-spending-goal.js";
import {
	listCurrentSubscriptions,
	todayInSaoPaulo,
} from "../services/subscriptions.js";
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

const recurringMonth = z.string().regex(monthPattern);

const recurringInput = z.object({
	kind: z.enum(["bill", "income"]),
	name: z.string().trim().min(1).max(128),
	amount: z.number().positive(),
	dayOfMonth: z.number().int().min(1).max(31),
	startMonth: recurringMonth.optional(),
	endMonth: recurringMonth.nullable().optional(),
	category: z.string().trim().min(1).max(64),
	matchText: z.string().trim().min(1).max(100).nullable().optional(),
});

const recurringPatch = z
	.object({
		name: z.string().trim().min(1).max(128).optional(),
		amount: z.number().positive().optional(),
		dayOfMonth: z.number().int().min(1).max(31).optional(),
		category: z.string().trim().min(1).max(64).optional(),
		matchText: z.string().trim().min(1).max(100).nullable().optional(),
		endMonth: recurringMonth.nullable().optional(),
		/** Changes apply from this month on; earlier months keep the old terms. */
		effectiveFrom: recurringMonth.optional(),
	})
	.refine(
		({ effectiveFrom: _from, ...rest }) =>
			Object.values(rest).some((value) => value !== undefined),
		{ message: "Informe ao menos um campo para editar." },
	);

function serializeRecurringItem(r: typeof recurringItem.$inferSelect): RecurringItemRow {
	return {
		id: r.id,
		kind: r.kind === "income" ? "income" : "bill",
		name: r.name,
		amount: Number(r.amount),
		dayOfMonth: r.dayOfMonth,
		startMonth: r.startMonth,
		endMonth: r.endMonth,
		category: r.category,
		matchText: r.matchText,
	};
}

const manualTransactionPatch = z
	.object({
		date: z.iso.date().optional(),
		amount: z.number().positive().optional(),
		category: z.string().trim().min(1).max(64).optional(),
		note: z.string().trim().max(280).nullable().optional(),
	})
	.refine((value) => Object.values(value).some((field) => field !== undefined), {
		message: "Informe ao menos um campo para editar.",
	});

const transactionSearchQuery = z.object({
	q: z.string().trim().min(1).max(100).optional(),
	from: z.iso.date().optional(),
	to: z.iso.date().optional(),
	minAmount: z.coerce.number().min(0).optional(),
	maxAmount: z.coerce.number().min(0).optional(),
	category: z.string().trim().min(1).max(64).optional(),
	kind: z.enum(["income", "expense"]).optional(),
	limit: z.coerce.number().int().min(1).max(200).default(50),
	cursor: z.string().max(12).optional(),
});

const recategorizeInput = z.object({
	ids: z.array(z.string().uuid()).min(1).max(100),
	category: z.string().trim().min(1).max(64),
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
	const { start, end } = getMonthBounds(params.month);
	return listFinanceTransactionsBetween({ userId: params.userId, start, end });
}

async function listFinanceTransactionsBetween(params: {
	userId: string;
	start: string;
	end: string;
}) {
	const { userId, start, end } = params;

	const [manualExpenses, pluggyRows] = await Promise.all([
		db
			.select()
			.from(expense)
			.where(buildManualExpensesWhere({ userId, start, end }))
			.orderBy(desc(expense.expenseDate), desc(expense.createdAt)),
		loadClassifiedPluggyTransactions({ userId, start, end }),
	]);

	const transactions = [
		// Own-money movements (transfers, savings, card bill payments) are left out.
		...pluggyRows
			.filter((row) => row.classification.kind !== "ignored")
			.map<FinanceTransactionRecord>((row) => ({
				id: row.id,
				date: row.date,
				amount: signedAmount(row.classification),
				category:
					row.categoryOverride?.trim() || row.category?.trim() || "Outros",
				description: row.description ?? null,
				source: "pluggy",
				sourceExternalId: null,
				sourceItemId: row.pluggyItemId,
				sourceProvider: row.provider,
				sourceAccountName: row.accountName,
				sourceAccountType: row.accountType,
				sourceAccountSubtype: row.accountSubtype,
				sourceAccountBrand: row.accountBrand,
				createdAt: row.createdAt,
				updatedAt: null,
				// Refunds show as money in; the summary nets them out of spending.
				kind: row.classification.kind === "expense" ? "expense" : "income",
				isDeletable: false,
				isHideable: row.classification.kind === "expense",
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

	const [manualExpensesResult, manualIncomeResult, pluggy] = await Promise.all([
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
		getPluggyTotals({ userId, start, end }),
	]);

	const spent = pluggy.spent + (manualExpensesResult?.totalSpent ?? 0);
	const totalIncome = pluggy.income + (manualIncomeResult?.totalIncome ?? 0);
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
	const [manualExpensesResult, pluggy] = await Promise.all([
		db
			.select({ totalSpent: sum(expense.amount).mapWith(Number) })
			.from(expense)
			.where(and(buildManualExpensesWhere({ userId, start, end }), eq(expense.kind, "expense")))
			.limit(1)
			.then((rows) => rows[0]),
		getPluggyTotals({ userId, start, end }),
	]);

	return (manualExpensesResult?.totalSpent ?? 0) + pluggy.spent;
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

export function registerFinanceRoutes(server: RouteRegistrar) {
	server.route({
		method: "GET",
		url: "/transactions",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw, { allowMcpToken: true });
				const month = (req.query as { month: string }).month;
				if (!monthPattern.test(month))
					return reply
						.status(400)
						.send(errorBody("VALIDATION_ERROR", "Mês inválido. Use o formato AAAA-MM."));

				const records = await listFinanceTransactions({
					userId: session.user.id,
					month,
				});
				return reply.send(records);
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send(errorBody("UNAUTHORIZED"));
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
						.send(errorBody("VALIDATION_ERROR", "Mês inválido. Use o formato AAAA-MM."));
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
					return reply.status(401).send(errorBody("UNAUTHORIZED"));
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
					return reply.status(401).send(errorBody("UNAUTHORIZED"));
				if (error instanceof z.ZodError)
					return reply.status(400).send({ error: error.message });
				throw error;
			}
		},
	});

	server.route({
		method: "GET",
		url: "/transactions/search",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw, { allowMcpToken: true });
				const parsed = transactionSearchQuery.safeParse(req.query);
				if (!parsed.success)
					return reply
						.status(400)
						.send(errorBody("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Busca inválida."));
				const { q, minAmount, maxAmount, category, kind, limit, cursor } = parsed.data;

				const today = new Date().toISOString().slice(0, 10);
				const defaultFrom = new Date(`${today}T00:00:00.000Z`);
				defaultFrom.setUTCMonth(defaultFrom.getUTCMonth() - 3);
				const from = parsed.data.from ?? defaultFrom.toISOString().slice(0, 10);
				const to = parsed.data.to ?? today;
				if (from > to)
					return reply
						.status(400)
						.send(errorBody("VALIDATION_ERROR", "A data inicial não pode ser depois da final."));
				const maxFrom = new Date(`${to}T00:00:00.000Z`);
				maxFrom.setUTCMonth(maxFrom.getUTCMonth() - 24);
				if (from < maxFrom.toISOString().slice(0, 10))
					return reply
						.status(400)
						.send(errorBody("VALIDATION_ERROR", "O período da busca pode ter no máximo 24 meses."));

				const all = await listFinanceTransactionsBetween({
					userId: session.user.id,
					start: from,
					end: to,
				});
				const matches = all.filter((tx) =>
					matchesTransactionSearch(tx, { q, minAmount, maxAmount, category, kind }),
				);
				const { page, total, nextCursor } = paginate(matches, { limit, cursor });
				return reply.send({ from, to, total, nextCursor, transactions: page });
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send(errorBody("UNAUTHORIZED"));
				throw error;
			}
		},
	});

	server.route({
		method: "PATCH",
		url: "/transactions/manual/:id",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
				const patch = manualTransactionPatch.safeParse(req.body ?? {});
				if (!patch.success)
					return reply
						.status(400)
						.send(errorBody("VALIDATION_ERROR", patch.error.issues[0]?.message ?? "Dados inválidos."));

				const [existing] = await db
					.select({ id: expense.id, source: expense.source })
					.from(expense)
					.where(and(eq(expense.id, id), eq(expense.userId, session.user.id)))
					.limit(1);

				if (!existing) {
					const [bank] = await db
						.select({ id: pluggyTransactions.id })
						.from(pluggyTransactions)
						.innerJoin(pluggyItems, eq(pluggyTransactions.pluggyItemId, pluggyItems.id))
						.where(and(eq(pluggyTransactions.id, id), eq(pluggyItems.userId, session.user.id)))
						.limit(1);
					if (bank)
						return reply.status(400).send(errorBody("BANK_TRANSACTION_READ_ONLY"));
					return reply.status(404).send(errorBody("NOT_FOUND", "Transação não encontrada."));
				}
				if (existing.source === "pluggy")
					return reply.status(400).send(errorBody("BANK_TRANSACTION_READ_ONLY"));

				const { date, amount, category, note } = patch.data;
				const [record] = await db
					.update(expense)
					.set({
						...(date !== undefined ? { expenseDate: date } : {}),
						...(amount !== undefined ? { amount: amount.toString() } : {}),
						...(category !== undefined ? { category } : {}),
						...(note !== undefined ? { note } : {}),
					})
					.where(and(eq(expense.id, id), eq(expense.userId, session.user.id)))
					.returning();
				return reply.send(serializeExpense(record!));
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send(errorBody("UNAUTHORIZED"));
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
					return reply.status(401).send(errorBody("UNAUTHORIZED"));
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
					return reply.status(401).send(errorBody("UNAUTHORIZED"));
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
						date: pluggyTransactions.date,
						amount: sql<number>`${pluggyTransactions.amount}`.mapWith(Number),
						category: pluggyTransactions.category,
						description: pluggyTransactions.description,
						accountId: pluggyTransactions.pluggyAccountId,
						accountType: pluggyAccounts.type,
					})
					.from(pluggyTransactions)
					.innerJoin(
						pluggyItems,
						eq(pluggyTransactions.pluggyItemId, pluggyItems.id),
					)
					.leftJoin(
						pluggyAccounts,
						eq(pluggyTransactions.pluggyAccountId, pluggyAccounts.id),
					)
					.where(
						and(
							eq(pluggyItems.userId, session.user.id),
							inArray(pluggyTransactions.id, ids),
						),
					);

				// Only spending can be hidden (card purchases are positive on Pluggy).
				const classified = classifyPluggyTransactions(ownedTransactions);
				const hideable = ownedTransactions.filter(
					(row) => classified.get(row.id)?.kind === "expense",
				);
				const hideableIds = hideable.map((row) => row.id);
				const itemIds = Array.from(new Set(hideable.map((row) => row.pluggyItemId)));

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
					return reply.status(401).send(errorBody("UNAUTHORIZED"));
				if (error instanceof z.ZodError)
					return reply.status(400).send({ error: error.message });
				throw error;
			}
		},
	});

	server.route({
		method: "POST",
		url: "/transactions/recategorize",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const { ids, category } = recategorizeInput.parse(req.body);
				const userId = session.user.id;

				// Bank transactions keep Pluggy's category for classification; the
				// override only changes how they are shown and grouped.
				const ownedPluggyIds = await db
					.select({
						id: pluggyTransactions.id,
						pluggyItemId: pluggyTransactions.pluggyItemId,
					})
					.from(pluggyTransactions)
					.innerJoin(
						pluggyItems,
						eq(pluggyTransactions.pluggyItemId, pluggyItems.id),
					)
					.where(
						and(
							eq(pluggyItems.userId, userId),
							inArray(pluggyTransactions.id, ids),
						),
					);

				if (ownedPluggyIds.length > 0) {
					await db
						.update(pluggyTransactions)
						.set({ categoryOverride: category })
						.where(
							inArray(
								pluggyTransactions.id,
								ownedPluggyIds.map((row) => row.id),
							),
						);
					await rebuildExpensesFromStoredTransactions({
						userId,
						localItemId: ownedPluggyIds[0]!.pluggyItemId,
					});
				}

				const manual = await db
					.update(expense)
					.set({ category, updatedAt: new Date() })
					.where(
						and(
							eq(expense.userId, userId),
							not(eq(expense.source, "pluggy")),
							inArray(expense.id, ids),
						),
					)
					.returning({ id: expense.id });

				return reply.send({ updated: ownedPluggyIds.length + manual.length });
			} catch (error) {
				return sendKnownError(reply, error);
			}
		},
	});

	server.route({
		method: "GET",
		url: "/categories",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw, { allowMcpToken: true });
				const rows = await db
					.select({
						category: expense.category,
						kind: expense.kind,
						count: sql<number>`count(*)`.mapWith(Number),
					})
					.from(expense)
					.where(eq(expense.userId, session.user.id))
					.groupBy(expense.category, expense.kind)
					.orderBy(desc(sql`count(*)`));
				return reply.send(rows);
			} catch (error) {
				return sendKnownError(reply, error);
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
					return reply.status(401).send(errorBody("UNAUTHORIZED"));
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
				const session = await requireSession(req.raw, { allowMcpToken: true });
				const query = req.query as { month: string; today?: string };
				if (!monthPattern.test(query.month))
					return reply
						.status(400)
						.send(errorBody("VALIDATION_ERROR", "Mês inválido. Use o formato AAAA-MM."));
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
					return reply.status(401).send(errorBody("UNAUTHORIZED"));
				throw error;
			}
		},
	});

	server.route({
		method: "GET",
		url: "/spending-goal",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw, { allowMcpToken: true });
				const query = req.query as { month?: string; today?: string };
				const month = query.month;
				if (!month || !monthPattern.test(month)) {
					return reply
						.status(400)
						.send(errorBody("VALIDATION_ERROR", "Mês inválido. Use o formato AAAA-MM."));
				}
				const today = query.today ?? new Date().toISOString().slice(0, 10);
				if (
					!/^\d{4}-\d{2}-\d{2}$/.test(today) ||
					Number.isNaN(Date.parse(today)) ||
					new Date(`${today}T00:00:00.000Z`).toISOString().slice(0, 10) !== today
				) {
					return reply
						.status(400)
						.send(errorBody("VALIDATION_ERROR", "Data inválida. Use o formato AAAA-MM-DD."));
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
					return reply.status(401).send(errorBody("UNAUTHORIZED"));
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
					return reply.status(401).send(errorBody("UNAUTHORIZED"));
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
				const session = await requireSession(req.raw, { allowMcpToken: true });
				const query = req.query as { month: string };
				if (!monthPattern.test(query.month))
					return reply
						.status(400)
						.send(errorBody("VALIDATION_ERROR", "Mês inválido. Use o formato AAAA-MM."));

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
					return reply.status(401).send(errorBody("UNAUTHORIZED"));
				throw error;
			}
		},
	});

	server.route({
		method: "GET",
		url: "/goals",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw, { allowMcpToken: true });
				const records = await db
					.select()
					.from(goal)
					.where(eq(goal.userId, session.user.id))
					.orderBy(asc(goal.createdAt));
				return reply.send(records.map(serializeGoal));
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send(errorBody("UNAUTHORIZED"));
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
				const { name, targetAmount, currentAmount, url, targetDate } = z
					.object({
						name: z.string().trim().min(1).max(128),
						targetAmount: z.number().positive(),
						currentAmount: z.number().min(0).default(0),
						url: optionalGoalUrl,
						targetDate: z.iso.date().nullable().optional(),
					})
					.parse(req.body);
				const [record] = await db
					.insert(goal)
					.values({
						userId: session.user.id,
						name,
						url,
						targetDate: targetDate ?? null,
						targetAmount: targetAmount.toString(),
						currentAmount: (currentAmount ?? 0).toString(),
						isCompleted: (currentAmount ?? 0) >= targetAmount,
					})
					.returning();
				return reply.code(201).send(serializeGoal(record!));
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send(errorBody("UNAUTHORIZED"));
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
						isCompleted: z.boolean().optional(),
						url: optionalGoalUrl,
						targetDate: z.iso.date().nullable().optional(),
					})
					.refine(
						(data) =>
							data.name !== undefined ||
							data.targetAmount !== undefined ||
							data.currentAmount !== undefined ||
							data.isCompleted !== undefined ||
							data.url !== undefined ||
							data.targetDate !== undefined,
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
					return reply.status(404).send(errorBody("NOT_FOUND", "Meta não encontrada."));
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
						...(body.isCompleted !== undefined
							? { isCompleted: body.isCompleted }
							: body.currentAmount !== undefined ||
									body.targetAmount !== undefined
								? {
										isCompleted:
											(body.currentAmount ?? Number(existing.currentAmount)) >=
											(body.targetAmount ?? Number(existing.targetAmount)),
									}
								: {}),
						...(body.url !== undefined ? { url: body.url } : {}),
						...(body.targetDate !== undefined ? { targetDate: body.targetDate } : {}),
					})
					.where(eq(goal.id, id))
					.returning();
				return reply.send(serializeGoal(record!));
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send(errorBody("UNAUTHORIZED"));
				if (error instanceof z.ZodError)
					return reply.status(400).send({ error: error.message });
				throw error;
			}
		},
	});

	async function findOwnGoal(userId: string, id: string) {
		const [row] = await db
			.select()
			.from(goal)
			.where(and(eq(goal.id, id), eq(goal.userId, userId)))
			.limit(1);
		return row;
	}

	const GOAL_NOT_FOUND = "Meta não encontrada.";

	server.route({
		method: "GET",
		url: "/goals/:id/plan",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw, { allowMcpToken: true });
				const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
				const row = await findOwnGoal(session.user.id, id);
				if (!row)
					return reply.status(404).send(errorBody("NOT_FOUND", GOAL_NOT_FOUND));
				return reply.send({
					goalId: row.id,
					name: row.name,
					targetAmount: Number(row.targetAmount),
					currentAmount: Number(row.currentAmount),
					...planGoal({
						targetAmount: Number(row.targetAmount),
						currentAmount: Number(row.currentAmount),
						targetDate: row.targetDate,
						today: todayInSaoPaulo(),
					}),
				});
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send(errorBody("UNAUTHORIZED"));
				if (error instanceof z.ZodError)
					return reply.status(400).send({ error: error.message });
				throw error;
			}
		},
	});

	server.route({
		method: "GET",
		url: "/goals/:id/contributions",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw, { allowMcpToken: true });
				const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
				if (!(await findOwnGoal(session.user.id, id)))
					return reply.status(404).send(errorBody("NOT_FOUND", GOAL_NOT_FOUND));
				const rows = await db
					.select()
					.from(goalContribution)
					.where(eq(goalContribution.goalId, id))
					.orderBy(desc(goalContribution.date), desc(goalContribution.createdAt));
				return reply.send(
					rows.map((row) => ({ ...row, amount: Number(row.amount) })),
				);
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send(errorBody("UNAUTHORIZED"));
				if (error instanceof z.ZodError)
					return reply.status(400).send({ error: error.message });
				throw error;
			}
		},
	});

	server.route({
		method: "POST",
		url: "/goals/:id/contributions",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
				const input = z
					.object({
						amount: z.number().positive(),
						kind: z.enum(["deposit", "withdrawal"]).default("deposit"),
						date: z.iso.date().optional(),
						note: z.string().trim().max(280).optional(),
					})
					.parse(req.body);

				const result = await db.transaction(async (tx) => {
					const [row] = await tx
						.select()
						.from(goal)
						.where(and(eq(goal.id, id), eq(goal.userId, session.user.id)))
						.for("update")
						.limit(1);
					if (!row) return { error: "not_found" as const };

					const next = applyContribution({
						currentAmount: Number(row.currentAmount),
						amount: input.amount,
						kind: input.kind,
					});
					if (next < 0) return { error: "overdraw" as const };

					const [contribution] = await tx
						.insert(goalContribution)
						.values({
							goalId: id,
							userId: session.user.id,
							amount: input.amount.toString(),
							kind: input.kind,
							date: input.date ?? todayInSaoPaulo(),
							note: input.note ?? null,
						})
						.returning();
					const [updated] = await tx
						.update(goal)
						.set({
							currentAmount: next.toString(),
							// Reaching the target completes the goal; a withdrawal never undoes it.
							...(next >= Number(row.targetAmount) ? { isCompleted: true } : {}),
						})
						.where(eq(goal.id, id))
						.returning();
					return { contribution: contribution!, goal: updated! };
				});

				if ("error" in result) {
					return result.error === "not_found"
						? reply.status(404).send(errorBody("NOT_FOUND", GOAL_NOT_FOUND))
						: reply
								.status(400)
								.send(errorBody("VALIDATION_ERROR", "A retirada é maior que o valor atual da meta."));
				}
				return reply.code(201).send({
					contribution: { ...result.contribution, amount: Number(result.contribution.amount) },
					goal: serializeGoal(result.goal),
				});
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send(errorBody("UNAUTHORIZED"));
				if (error instanceof z.ZodError)
					return reply.status(400).send({ error: error.message });
				throw error;
			}
		},
	});

	server.route({
		method: "DELETE",
		url: "/goals/:id/contributions/:contributionId",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const { id, contributionId } = z
					.object({ id: z.string().uuid(), contributionId: z.string().uuid() })
					.parse(req.params);

				const result = await db.transaction(async (tx) => {
					const [row] = await tx
						.select()
						.from(goal)
						.where(and(eq(goal.id, id), eq(goal.userId, session.user.id)))
						.for("update")
						.limit(1);
					if (!row) return { error: "goal" as const };
					const [contribution] = await tx
						.select()
						.from(goalContribution)
						.where(
							and(
								eq(goalContribution.id, contributionId),
								eq(goalContribution.goalId, id),
							),
						)
						.limit(1);
					if (!contribution) return { error: "contribution" as const };

					const next = applyContribution({
						currentAmount: Number(row.currentAmount),
						amount: Number(contribution.amount),
						kind: contribution.kind === "withdrawal" ? "withdrawal" : "deposit",
						undo: true,
					});
					await tx.delete(goalContribution).where(eq(goalContribution.id, contributionId));
					const [updated] = await tx
						.update(goal)
						.set({ currentAmount: Math.max(next, 0).toString() })
						.where(eq(goal.id, id))
						.returning();
					return { goal: updated! };
				});

				if ("error" in result)
					return reply
						.status(404)
						.send(
							errorBody(
								"NOT_FOUND",
								result.error === "goal" ? GOAL_NOT_FOUND : "Aporte não encontrado.",
							),
						);
				return reply.send({ deleted: 1, goal: serializeGoal(result.goal) });
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send(errorBody("UNAUTHORIZED"));
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
					return reply.status(404).send(errorBody("NOT_FOUND", "Meta não encontrada."));
				await db.delete(goal).where(eq(goal.id, id));
				return reply.status(204).send();
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send(errorBody("UNAUTHORIZED"));
				if (error instanceof z.ZodError)
					return reply.status(400).send({ error: error.message });
				throw error;
			}
		},
	});

	server.route({
		method: "GET",
		url: "/subscriptions",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw, { allowMcpToken: true });
				return reply.send(
					await listCurrentSubscriptions({ userId: session.user.id }),
				);
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send(errorBody("UNAUTHORIZED"));
				throw error;
			}
		},
	});

	server.route({
		method: "GET",
		url: "/monthly-bills",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw, { allowMcpToken: true });
				const month = (req.query as { month: string }).month;
				if (!monthPattern.test(month))
					return reply
						.status(400)
						.send(errorBody("VALIDATION_ERROR", "Mês inválido. Use o formato AAAA-MM."));
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
				const flatItems = items.flat();
				const billIds = flatItems
					.map((item) => item.pluggyBillId)
					.filter((id): id is string => Boolean(id));
				const [bankRows, manualRows] =
					billIds.length === 0
						? [[], []]
						: await Promise.all([
								db
									.select({
										pluggyBillId: pluggyBills.pluggyBillId,
										paidAmount: pluggyBills.paidAmount,
										dueDate: pluggyBills.dueDate,
										billClosingDate: pluggyBills.billClosingDate,
										minimumPaymentAmount: pluggyBills.minimumPaymentAmount,
									})
									.from(pluggyBills)
									.where(inArray(pluggyBills.pluggyBillId, billIds)),
								db
									.select({ pluggyBillId: billPaymentOverride.pluggyBillId })
									.from(billPaymentOverride)
									.where(
										and(
											eq(billPaymentOverride.userId, session.user.id),
											inArray(billPaymentOverride.pluggyBillId, billIds),
										),
									),
							]);
				const bankPaidByBill = new Map(
					bankRows.map((row) => [row.pluggyBillId, Number(row.paidAmount) || 0]),
				);
				const billInfo = new Map(
					bankRows.map((row) => [
						row.pluggyBillId,
						{
							// Pluggy sends midnight UTC; the date part is the due day as the bank states it.
							dueDate: row.dueDate.toISOString().slice(0, 10),
							closingDate: dateOnly(row.billClosingDate),
							minimumPaymentAmount:
								row.minimumPaymentAmount === null
									? null
									: Number(row.minimumPaymentAmount),
						},
					]),
				);
				const manualBills = new Set(manualRows.map((row) => row.pluggyBillId));
				return reply.send({
					bills: bills.map(serializeMonthlyBill),
					items: flatItems.map((item) => ({
						...item,
						dueDate: billInfo.get(item.pluggyBillId ?? "")?.dueDate ?? null,
						closingDate: billInfo.get(item.pluggyBillId ?? "")?.closingDate ?? null,
						minimumPaymentAmount:
							billInfo.get(item.pluggyBillId ?? "")?.minimumPaymentAmount ?? null,
						paidSource: item.pluggyBillId
							? paidSource({
									bankPaid: bankPaidByBill.get(item.pluggyBillId) ?? 0,
									effectivePaid: item.paidAmount,
									hasManualPayment: manualBills.has(item.pluggyBillId),
								})
							: null,
					})),
				});
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send(errorBody("UNAUTHORIZED"));
				throw error;
			}
		},
	});

	// --- Category limits ---

	const categoryLimitBody = z.object({
		month: z.string().regex(monthPattern),
		category: z.string().trim().min(1).max(64),
	});

	server.route({
		method: "GET",
		url: "/category-limits",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw, { allowMcpToken: true });
				const month = (req.query as { month?: string }).month;
				if (!month || !monthPattern.test(month))
					return reply
						.status(400)
						.send(errorBody("VALIDATION_ERROR", "Mês inválido. Use o formato AAAA-MM."));

				const limits = await db
					.select()
					.from(monthlyCategoryLimit)
					.where(
						and(
							eq(monthlyCategoryLimit.userId, session.user.id),
							eq(monthlyCategoryLimit.month, month),
						),
					)
					.orderBy(asc(monthlyCategoryLimit.category));
				if (limits.length === 0) return reply.send({ month, limits: [] });

				const transactions = await listFinanceTransactions({
					userId: session.user.id,
					month,
				});
				return reply.send({
					month,
					limits: calculateCategoryLimits({
						limits: limits.map((row) => ({
							category: row.category,
							targetAmount: Number(row.targetAmount),
						})),
						transactions,
					}),
				});
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send(errorBody("UNAUTHORIZED"));
				throw error;
			}
		},
	});

	server.route({
		method: "POST",
		url: "/category-limits",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const { month, category, targetAmount } = categoryLimitBody
					.extend({ targetAmount: z.number().positive() })
					.parse(req.body);
				const categoryKey = normalizeText(category);

				const [record] = await db
					.insert(monthlyCategoryLimit)
					.values({
						userId: session.user.id,
						month,
						category,
						categoryKey,
						targetAmount: targetAmount.toString(),
					})
					.onConflictDoUpdate({
						target: [
							monthlyCategoryLimit.userId,
							monthlyCategoryLimit.month,
							monthlyCategoryLimit.categoryKey,
						],
						set: { category, targetAmount: targetAmount.toString() },
					})
					.returning();
				return reply.send({
					month: record!.month,
					category: record!.category,
					targetAmount: Number(record!.targetAmount),
				});
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send(errorBody("UNAUTHORIZED"));
				if (error instanceof z.ZodError)
					return reply.status(400).send({ error: error.message });
				throw error;
			}
		},
	});

	server.route({
		method: "DELETE",
		url: "/category-limits",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const { month, category } = categoryLimitBody.parse(req.body);
				const removed = await db
					.delete(monthlyCategoryLimit)
					.where(
						and(
							eq(monthlyCategoryLimit.userId, session.user.id),
							eq(monthlyCategoryLimit.month, month),
							eq(monthlyCategoryLimit.categoryKey, normalizeText(category)),
						),
					)
					.returning({ id: monthlyCategoryLimit.id });
				if (removed.length === 0)
					return reply
						.status(404)
						.send(errorBody("NOT_FOUND", "Limite não encontrado para essa categoria e mês."));
				return reply.send({ deleted: removed.length });
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send(errorBody("UNAUTHORIZED"));
				if (error instanceof z.ZodError)
					return reply.status(400).send({ error: error.message });
				throw error;
			}
		},
	});

	server.route({
		method: "POST",
		url: "/category-limits/copy",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const { fromMonth, toMonth } = z
					.object({
						fromMonth: z.string().regex(monthPattern),
						toMonth: z.string().regex(monthPattern),
					})
					.refine((value) => value.fromMonth !== value.toMonth, {
						message: "Os meses de origem e destino precisam ser diferentes.",
					})
					.parse(req.body);

				const source = await db
					.select()
					.from(monthlyCategoryLimit)
					.where(
						and(
							eq(monthlyCategoryLimit.userId, session.user.id),
							eq(monthlyCategoryLimit.month, fromMonth),
						),
					);
				if (source.length === 0) return reply.send({ copied: 0, skipped: 0 });

				// Existing limits in the destination month are kept as they are.
				const inserted = await db
					.insert(monthlyCategoryLimit)
					.values(
						source.map((row) => ({
							userId: session.user.id,
							month: toMonth,
							category: row.category,
							categoryKey: row.categoryKey,
							targetAmount: row.targetAmount,
						})),
					)
					.onConflictDoNothing()
					.returning({ id: monthlyCategoryLimit.id });
				return reply.send({
					copied: inserted.length,
					skipped: source.length - inserted.length,
				});
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send(errorBody("UNAUTHORIZED"));
				if (error instanceof z.ZodError)
					return reply.status(400).send({ error: error.message });
				throw error;
			}
		},
	});

	// --- Credit cards ---

	server.route({
		method: "GET",
		url: "/credit-cards",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw, { allowMcpToken: true });
				const accounts = await db
					.select({
						id: pluggyAccounts.id,
						name: pluggyAccounts.name,
						brand: pluggyAccounts.brand,
						status: pluggyAccounts.status,
						creditLimit: pluggyAccounts.creditLimit,
						availableCreditLimit: pluggyAccounts.availableCreditLimit,
						balanceDueDate: pluggyAccounts.balanceDueDate,
						balanceCloseDate: pluggyAccounts.balanceCloseDate,
						minimumPayment: pluggyAccounts.minimumPayment,
						provider: pluggyItems.provider,
					})
					.from(pluggyAccounts)
					.innerJoin(pluggyItems, eq(pluggyAccounts.pluggyItemId, pluggyItems.id))
					.where(and(eq(pluggyItems.userId, session.user.id), eq(pluggyAccounts.type, "CREDIT")))
					.orderBy(asc(pluggyAccounts.name));
				if (accounts.length === 0) return reply.send({ cards: [] });

				const ids = accounts.map((account) => account.id);
				const [bills, unbilled] = await Promise.all([
					db
						.select()
						.from(pluggyBills)
						.where(inArray(pluggyBills.pluggyAccountId, ids))
						.orderBy(desc(pluggyBills.dueDate)),
					// Purchases no closed bill has claimed yet make up the open bill. Card
					// payments are left out, as when the monthly bills are rebuilt.
					db
						.select({
							accountId: pluggyTransactions.pluggyAccountId,
							date: pluggyTransactions.date,
							amount: pluggyTransactions.amount,
						})
						.from(pluggyTransactions)
						.where(
							and(
								inArray(pluggyTransactions.pluggyAccountId, ids),
								isNull(pluggyTransactions.pluggyBillId),
								isNull(pluggyTransactions.hiddenAt),
								sql`coalesce(${pluggyTransactions.category}, '') <> 'Credit card payment'`,
								sql`coalesce(${pluggyTransactions.description}, '') not ilike 'pagamento recebido%'`,
							),
						),
				]);

				const cards = accounts.map((account) => {
					const last = bills.find((bill) => bill.pluggyAccountId === account.id);
					const lastDueDate = dateOnly(last?.dueDate);
					const lastClosingDate = dateOnly(last?.billClosingDate);
					// Old rows saved before billId existed are still unbilled in the
					// table but belong to bills that closed long ago.
					const since = openBillSince(lastDueDate, lastClosingDate);
					const open = unbilled.filter(
						(row) => row.accountId === account.id && (since === null || row.date > since),
					);
					return {
						id: account.id,
						name: account.name,
						brand: account.brand,
						status: account.status,
						provider: account.provider,
						limit: summarizeLimit(
							account.creditLimit === null ? null : Number(account.creditLimit),
							account.availableCreditLimit === null ? null : Number(account.availableCreditLimit),
						),
						// What the card itself reports about its last closed bill.
						reported: {
							dueDate: dateOnly(account.balanceDueDate),
							closeDate: dateOnly(account.balanceCloseDate),
							minimumPayment:
								account.minimumPayment === null ? null : Number(account.minimumPayment),
						},
						lastBill: last
							? {
									pluggyBillId: last.pluggyBillId,
									dueDate: lastDueDate,
									closingDate: lastClosingDate,
									totalAmount: Number(last.totalAmount),
									minimumPaymentAmount:
										last.minimumPaymentAmount === null ? null : Number(last.minimumPaymentAmount),
									paidAmount: Number(last.paidAmount),
								}
							: null,
						openBill: estimateOpenBill({
							lastDueDate,
							lastClosingDate,
							unbilledTotal: open.reduce((sum, row) => sum + Number(row.amount), 0),
							unbilledCount: open.length,
						}),
					};
				});
				return reply.send({ cards });
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send(errorBody("UNAUTHORIZED"));
				throw error;
			}
		},
	});

	server.route({
		method: "GET",
		url: "/installments",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw, { allowMcpToken: true });
				const parsed = z
					.object({ months: z.coerce.number().int().min(1).max(12).default(6) })
					.safeParse(req.query);
				if (!parsed.success)
					return reply
						.status(400)
						.send(errorBody("VALIDATION_ERROR", "months deve ser um número de 1 a 12."));

				const today = todayInSaoPaulo();
				// Long enough to see a purchase of up to a year from its first installment.
				const since = addMonthsClamped(today, -16);
				const rows = await db
					.select({
						id: pluggyTransactions.id,
						accountId: pluggyTransactions.pluggyAccountId,
						cardName: pluggyAccounts.name,
						date: pluggyTransactions.date,
						amount: pluggyTransactions.amount,
						description: pluggyTransactions.description,
						installmentNumber: pluggyTransactions.installmentNumber,
						totalInstallments: pluggyTransactions.totalInstallments,
					})
					.from(pluggyTransactions)
					.innerJoin(pluggyAccounts, eq(pluggyTransactions.pluggyAccountId, pluggyAccounts.id))
					.innerJoin(pluggyItems, eq(pluggyAccounts.pluggyItemId, pluggyItems.id))
					.where(
						and(
							eq(pluggyItems.userId, session.user.id),
							eq(pluggyAccounts.type, "CREDIT"),
							isNull(pluggyTransactions.hiddenAt),
							gte(pluggyTransactions.date, since),
						),
					);

				const plans = activePlans(
					buildInstallmentPlans(
						rows.map((row) => ({
							id: row.id,
							accountId: row.accountId ?? "",
							cardName: row.cardName,
							date: row.date,
							amount: Number(row.amount),
							description: row.description,
							installmentNumber: row.installmentNumber,
							totalInstallments: row.totalInstallments,
						})),
					),
					today,
				);
				return reply.send({
					plans,
					upcoming: projectUpcoming(plans, today, parsed.data.months),
					summary: {
						activePlans: plans.length,
						remainingInstallments: plans.reduce((sum, plan) => sum + plan.remainingInstallments, 0),
						remainingAmount:
							Math.round(plans.reduce((sum, plan) => sum + plan.remainingAmount, 0) * 100) / 100,
					},
				});
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send(errorBody("UNAUTHORIZED"));
				throw error;
			}
		},
	});

	// --- Fixed bills and recurring income ---

	const RECURRING_NOT_FOUND = "Item recorrente não encontrado.";

	server.route({
		method: "GET",
		url: "/recurring",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw, { allowMcpToken: true });
				const query = req.query as { month?: string; all?: string };
				const month = query.month ?? todayInSaoPaulo().slice(0, 7);
				if (!monthPattern.test(month))
					return reply
						.status(400)
						.send(errorBody("VALIDATION_ERROR", "Mês inválido. Use o formato AAAA-MM."));

				const rows = await db
					.select()
					.from(recurringItem)
					.where(eq(recurringItem.userId, session.user.id))
					.orderBy(asc(recurringItem.startMonth), asc(recurringItem.name));
				const items = rows.map(serializeRecurringItem);

				// Every item, including the ended ones, so an old one can still be found.
				if (query.all === "true") return reply.send({ items });

				const [paid, transactions] = await Promise.all([
					db
						.select({ itemId: recurringPayment.itemId })
						.from(recurringPayment)
						.where(
							and(
								eq(recurringPayment.userId, session.user.id),
								eq(recurringPayment.month, month),
							),
						),
					listFinanceTransactions({ userId: session.user.id, month }),
				]);
				const occurrences = buildOccurrences({
					month,
					items,
					transactions,
					paidByHand: new Set(paid.map((row) => row.itemId)),
				});
				return reply.send({
					month,
					items: occurrences,
					summary: summarizeOccurrences(occurrences),
				});
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send(errorBody("UNAUTHORIZED"));
				throw error;
			}
		},
	});

	server.route({
		method: "POST",
		url: "/recurring",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const input = recurringInput.parse(req.body);
				const startMonth = input.startMonth ?? todayInSaoPaulo().slice(0, 7);
				if (input.endMonth && input.endMonth < startMonth)
					return reply
						.status(400)
						.send(errorBody("VALIDATION_ERROR", "O mês final não pode ser antes do inicial."));

				const [record] = await db
					.insert(recurringItem)
					.values({
						userId: session.user.id,
						kind: input.kind,
						name: input.name,
						amount: input.amount.toString(),
						dayOfMonth: input.dayOfMonth,
						startMonth,
						endMonth: input.endMonth ?? null,
						category: input.category,
						matchText: input.matchText ?? null,
					})
					.returning();
				return reply.code(201).send(serializeRecurringItem(record!));
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send(errorBody("UNAUTHORIZED"));
				if (error instanceof z.ZodError)
					return reply.status(400).send({ error: error.message });
				throw error;
			}
		},
	});

	server.route({
		method: "PATCH",
		url: "/recurring/:id",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
				const patch = recurringPatch.safeParse(req.body ?? {});
				if (!patch.success)
					return reply
						.status(400)
						.send(errorBody("VALIDATION_ERROR", patch.error.issues[0]?.message ?? "Dados inválidos."));
				const { effectiveFrom, endMonth, ...terms } = patch.data;

				const result = await db.transaction(async (tx) => {
					const [row] = await tx
						.select()
						.from(recurringItem)
						.where(and(eq(recurringItem.id, id), eq(recurringItem.userId, session.user.id)))
						.for("update")
						.limit(1);
					if (!row) return { error: "not_found" as const };

					const newEnd = endMonth !== undefined ? endMonth : row.endMonth;
					const changesTerms = Object.values(terms).some((value) => value !== undefined);
					const values = {
						name: terms.name ?? row.name,
						amount: terms.amount !== undefined ? terms.amount.toString() : row.amount,
						dayOfMonth: terms.dayOfMonth ?? row.dayOfMonth,
						category: terms.category ?? row.category,
						matchText: terms.matchText !== undefined ? terms.matchText : row.matchText,
					};

					// "From this month on": the old line stops the month before and a new
					// one starts, so past months keep the amount they had.
					if (changesTerms && effectiveFrom && effectiveFrom > row.startMonth) {
						if (row.endMonth && effectiveFrom > row.endMonth) return { error: "after_end" as const };
						if (newEnd && newEnd < effectiveFrom) return { error: "bad_end" as const };
						const [closed] = await tx
							.update(recurringItem)
							.set({ endMonth: previousMonth(effectiveFrom) })
							.where(eq(recurringItem.id, id))
							.returning();
						const [created] = await tx
							.insert(recurringItem)
							.values({
								userId: session.user.id,
								kind: row.kind,
								...values,
								startMonth: effectiveFrom,
								endMonth: newEnd,
							})
							.returning();
						return { item: created!, previous: closed! };
					}

					if (newEnd && newEnd < row.startMonth) return { error: "bad_end" as const };
					const [updated] = await tx
						.update(recurringItem)
						.set({ ...values, endMonth: newEnd })
						.where(eq(recurringItem.id, id))
						.returning();
					return { item: updated!, previous: null };
				});

				if ("error" in result) {
					return result.error === "not_found"
						? reply.status(404).send(errorBody("NOT_FOUND", RECURRING_NOT_FOUND))
						: reply
								.status(400)
								.send(
									errorBody(
										"VALIDATION_ERROR",
										result.error === "after_end"
											? "A data de vigência está depois do fim do item."
											: "O mês final não pode ser antes do início.",
									),
								);
				}
				return reply.send({
					item: serializeRecurringItem(result.item),
					previous: result.previous ? serializeRecurringItem(result.previous) : null,
				});
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send(errorBody("UNAUTHORIZED"));
				if (error instanceof z.ZodError)
					return reply.status(400).send({ error: error.message });
				throw error;
			}
		},
	});

	server.route({
		method: "DELETE",
		url: "/recurring/:id",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
				const removed = await db
					.delete(recurringItem)
					.where(and(eq(recurringItem.id, id), eq(recurringItem.userId, session.user.id)))
					.returning({ id: recurringItem.id });
				if (removed.length === 0)
					return reply.status(404).send(errorBody("NOT_FOUND", RECURRING_NOT_FOUND));
				return reply.send({ deleted: 1 });
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send(errorBody("UNAUTHORIZED"));
				if (error instanceof z.ZodError)
					return reply.status(400).send({ error: error.message });
				throw error;
			}
		},
	});

	server.route({
		method: "POST",
		url: "/recurring/:id/paid",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
				const { month } = z.object({ month: recurringMonth }).parse(req.body);

				const [row] = await db
					.select()
					.from(recurringItem)
					.where(and(eq(recurringItem.id, id), eq(recurringItem.userId, session.user.id)))
					.limit(1);
				if (!row) return reply.status(404).send(errorBody("NOT_FOUND", RECURRING_NOT_FOUND));
				if (!isActiveIn(row, month))
					return reply
						.status(400)
						.send(errorBody("VALIDATION_ERROR", "O item não vale nesse mês."));

				await db
					.insert(recurringPayment)
					.values({ itemId: id, userId: session.user.id, month })
					.onConflictDoNothing();
				return reply.send({ itemId: id, month, paid: true });
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send(errorBody("UNAUTHORIZED"));
				if (error instanceof z.ZodError)
					return reply.status(400).send({ error: error.message });
				throw error;
			}
		},
	});

	server.route({
		method: "DELETE",
		url: "/recurring/:id/paid",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
				const { month } = z.object({ month: recurringMonth }).parse(req.body);

				const [row] = await db
					.select({ id: recurringItem.id })
					.from(recurringItem)
					.where(and(eq(recurringItem.id, id), eq(recurringItem.userId, session.user.id)))
					.limit(1);
				if (!row) return reply.status(404).send(errorBody("NOT_FOUND", RECURRING_NOT_FOUND));

				const removed = await db
					.delete(recurringPayment)
					.where(and(eq(recurringPayment.itemId, id), eq(recurringPayment.month, month)))
					.returning({ id: recurringPayment.id });
				return reply.send({ itemId: id, month, cleared: removed.length > 0 });
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send(errorBody("UNAUTHORIZED"));
				if (error instanceof z.ZodError)
					return reply.status(400).send({ error: error.message });
				throw error;
			}
		},
	});

	// --- Manual bill payments ---

	async function findOwnBill(userId: string, pluggyBillId: string) {
		const [bill] = await db
			.select({ pluggyBillId: pluggyBills.pluggyBillId })
			.from(pluggyBills)
			.innerJoin(pluggyAccounts, eq(pluggyBills.pluggyAccountId, pluggyAccounts.id))
			.innerJoin(pluggyItems, eq(pluggyAccounts.pluggyItemId, pluggyItems.id))
			.where(
				and(eq(pluggyItems.userId, userId), eq(pluggyBills.pluggyBillId, pluggyBillId)),
			)
			.limit(1);
		return bill;
	}

	server.route({
		method: "POST",
		url: "/bills/:pluggyBillId/paid",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const { pluggyBillId } = z
					.object({ pluggyBillId: z.string().min(1) })
					.parse(req.params);
				const { paidAmount } = z
					.object({ paidAmount: z.number().positive().optional() })
					.parse(req.body ?? {});

				if (!(await findOwnBill(session.user.id, pluggyBillId)))
					return reply
						.status(404)
						.send(errorBody("NOT_FOUND", "Fatura não encontrada."));

				await db
					.insert(billPaymentOverride)
					.values({
						userId: session.user.id,
						pluggyBillId,
						paidAmount: paidAmount === undefined ? null : paidAmount.toString(),
					})
					.onConflictDoUpdate({
						target: [billPaymentOverride.userId, billPaymentOverride.pluggyBillId],
						set: {
							paidAmount: paidAmount === undefined ? null : paidAmount.toString(),
						},
					});
				await materializeMonthlyBillsFromPluggy({ userId: session.user.id });

				return reply.send({ pluggyBillId, paidAmount: paidAmount ?? null });
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send(errorBody("UNAUTHORIZED"));
				if (error instanceof z.ZodError)
					return reply.status(400).send({ error: error.message });
				throw error;
			}
		},
	});

	server.route({
		method: "DELETE",
		url: "/bills/:pluggyBillId/paid",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const { pluggyBillId } = z
					.object({ pluggyBillId: z.string().min(1) })
					.parse(req.params);

				if (!(await findOwnBill(session.user.id, pluggyBillId)))
					return reply
						.status(404)
						.send(errorBody("NOT_FOUND", "Fatura não encontrada."));

				const removed = await db
					.delete(billPaymentOverride)
					.where(
						and(
							eq(billPaymentOverride.userId, session.user.id),
							eq(billPaymentOverride.pluggyBillId, pluggyBillId),
						),
					)
					.returning({ id: billPaymentOverride.id });
				await materializeMonthlyBillsFromPluggy({ userId: session.user.id });

				return reply.send({ pluggyBillId, cleared: removed.length > 0 });
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send(errorBody("UNAUTHORIZED"));
				if (error instanceof z.ZodError)
					return reply.status(400).send({ error: error.message });
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
						.send(errorBody("VALIDATION_ERROR", "Mês inválido. Use o formato AAAA-MM."));
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
					return reply.status(401).send(errorBody("UNAUTHORIZED"));
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
						.send(errorBody("VALIDATION_ERROR", "Mês inválido. Use o formato AAAA-MM."));
				}

				const percentage = body.savingsPercentage;
				if (
					typeof percentage !== "number" ||
					percentage < 0 ||
					percentage > 100
				) {
					return reply
						.status(400)
						.send(errorBody("VALIDATION_ERROR", "O percentual de economia deve estar entre 0 e 100."));
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
					return reply.status(401).send(errorBody("UNAUTHORIZED"));
				throw error;
			}
		},
	});
}
