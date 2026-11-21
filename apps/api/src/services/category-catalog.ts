import { and, eq, inArray, not } from "drizzle-orm";
import { db } from "../db/index.js";
import {
	category,
	categoryAlertSent,
	categoryRule,
	expense,
	monthlyCategoryLimit,
	pluggyItems,
	pluggyTransactions,
	recurringItem,
} from "../db/schema/index.js";
import { AppError } from "../lib/http-errors.js";
import {
	type CategoryRuleLike,
	type RuleMatchType,
	normalizeLabel,
	resolveDisplayCategory,
} from "./category-rules.js";
import { rebuildExpensesFromStoredTransactions } from "./pluggy.js";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type CategoryMoveResult = {
	manualTransactions: number;
	bankTransactions: number;
	rules: number;
	limits: number;
	recurringItems: number;
};

/** A category name as stored: trimmed, single-spaced. */
export function cleanCategoryName(name: string) {
	return name.trim().replace(/\s+/g, " ");
}

async function loadRules(tx: Tx, userId: string): Promise<CategoryRuleLike[]> {
	const rows = await tx
		.select()
		.from(categoryRule)
		.where(eq(categoryRule.userId, userId));
	return rows.map((row) => ({
		id: row.id,
		matchType: row.matchType as RuleMatchType,
		pattern: row.pattern,
		category: row.category,
		priority: row.priority,
		enabled: row.enabled,
		createdAt: row.createdAt,
	}));
}

async function loadBankRows(tx: Tx, userId: string) {
	return tx
		.select({
			id: pluggyTransactions.id,
			category: pluggyTransactions.category,
			override: pluggyTransactions.categoryOverride,
			description: pluggyTransactions.description,
		})
		.from(pluggyTransactions)
		.innerJoin(pluggyItems, eq(pluggyTransactions.pluggyItemId, pluggyItems.id))
		.where(eq(pluggyItems.userId, userId));
}

/**
 * Which stored rows show the category. Bank rows count by what is displayed
 * (override, rule, then the bank's name), so a category that only exists as the
 * bank's own name is still "in use".
 */
async function findUsage(tx: Tx, userId: string, key: string) {
	const sameKey = (value: string | null) => normalizeLabel(value) === key;

	const manualNames = (
		await tx
			.selectDistinct({ category: expense.category })
			.from(expense)
			.where(and(eq(expense.userId, userId), not(eq(expense.source, "pluggy"))))
	)
		.map((row) => row.category)
		.filter(sameKey);

	const rules = await loadRules(tx, userId);
	const bank = (await loadBankRows(tx, userId)).filter(
		(row) =>
			sameKey(
				resolveDisplayCategory({
					override: row.override,
					original: row.category,
					description: row.description,
					rules,
				}),
			),
	);
	const recurring = (
		await tx
			.select({ id: recurringItem.id, category: recurringItem.category })
			.from(recurringItem)
			.where(eq(recurringItem.userId, userId))
	).filter((row) => sameKey(row.category));
	const limits = (
		await tx
			.select({ id: monthlyCategoryLimit.id, category: monthlyCategoryLimit.category })
			.from(monthlyCategoryLimit)
			.where(eq(monthlyCategoryLimit.userId, userId))
	).filter((row) => sameKey(row.category));

	return {
		manualNames,
		rules: rules.filter((rule) => sameKey(rule.category)),
		bank,
		recurring,
		limits,
	};
}

export async function categoryUsageCount(userId: string, name: string) {
	const usage = await db.transaction((tx) =>
		findUsage(tx, userId, normalizeLabel(name)),
	);
	let manual = 0;
	if (usage.manualNames.length > 0) {
		const rows = await db
			.select({ id: expense.id })
			.from(expense)
			.where(
				and(
					eq(expense.userId, userId),
					not(eq(expense.source, "pluggy")),
					inArray(expense.category, usage.manualNames),
				),
			);
		manual = rows.length;
	}
	return (
		manual +
		usage.rules.length +
		usage.bank.length +
		usage.recurring.length +
		usage.limits.length
	);
}

/**
 * Renames/merges one category into another everywhere it is stored, in a
 * single database transaction: manual expenses, bank overrides, rules, monthly
 * limits and recurring items. If any step fails nothing changes. The derived
 * `expense` rows of bank transactions are rebuilt afterwards; they can always
 * be recomputed, so they are not part of the all-or-nothing step.
 */
export async function moveCategory(params: {
	userId: string;
	from: string;
	to: string;
}): Promise<CategoryMoveResult> {
	const { userId } = params;
	const fromKey = normalizeLabel(params.from);
	const toName = cleanCategoryName(params.to);
	const toKey = normalizeLabel(toName);
	const sameKey = (value: string | null) => normalizeLabel(value) === fromKey;

	const result = await db.transaction(async (tx) => {
		const moved: CategoryMoveResult = {
			manualTransactions: 0,
			bankTransactions: 0,
			rules: 0,
			limits: 0,
			recurringItems: 0,
		};

		// Manual expenses and incomes.
		const manualNames = (
			await tx
				.selectDistinct({ category: expense.category })
				.from(expense)
				.where(and(eq(expense.userId, userId), not(eq(expense.source, "pluggy"))))
		)
			.map((row) => row.category)
			.filter(sameKey);
		if (manualNames.length > 0) {
			const updated = await tx
				.update(expense)
				.set({ category: toName })
				.where(
					and(
						eq(expense.userId, userId),
						not(eq(expense.source, "pluggy")),
						inArray(expense.category, manualNames),
					),
				)
				.returning({ id: expense.id });
			moved.manualTransactions = updated.length;
		}

		// Rules: the rule is what shows the name on matching bank transactions.
		const ruleIds = (await loadRules(tx, userId))
			.filter((rule) => sameKey(rule.category))
			.map((rule) => rule.id);
		if (ruleIds.length > 0) {
			await tx
				.update(categoryRule)
				.set({ category: toName })
				.where(inArray(categoryRule.id, ruleIds));
			moved.rules = ruleIds.length;
		}

		// Recurring bills and incomes.
		const recurringIds = (
			await tx
				.select({ id: recurringItem.id, category: recurringItem.category })
				.from(recurringItem)
				.where(eq(recurringItem.userId, userId))
		)
			.filter((row) => sameKey(row.category))
			.map((row) => row.id);
		if (recurringIds.length > 0) {
			await tx
				.update(recurringItem)
				.set({ category: toName })
				.where(inArray(recurringItem.id, recurringIds));
			moved.recurringItems = recurringIds.length;
		}

		// Bank transactions: an override with the old name, or the bank's own
		// name shown as is. Rows a rule renames are covered by the rule above.
		const rulesNow = await loadRules(tx, userId);
		const bankIds = (await loadBankRows(tx, userId))
			.filter((row) => {
				if (row.override?.trim()) return sameKey(row.override);
				const shown = resolveDisplayCategory({
					override: null,
					original: row.category,
					description: row.description,
					rules: rulesNow,
				});
				return sameKey(shown) && sameKey(row.category);
			})
			.map((row) => row.id);
		for (let i = 0; i < bankIds.length; i += 500) {
			await tx
				.update(pluggyTransactions)
				.set({ categoryOverride: toName })
				.where(inArray(pluggyTransactions.id, bankIds.slice(i, i + 500)));
		}
		moved.bankTransactions = bankIds.length;

		// Monthly limits: if the destination already has one that month, it stays.
		const limits = (
			await tx
				.select()
				.from(monthlyCategoryLimit)
				.where(eq(monthlyCategoryLimit.userId, userId))
		);
		for (const limit of limits.filter((row) => sameKey(row.category))) {
			const clash = limits.some(
				(other) =>
					other.id !== limit.id &&
					other.month === limit.month &&
					normalizeLabel(other.category) === toKey,
			);
			if (clash) {
				await tx
					.delete(monthlyCategoryLimit)
					.where(eq(monthlyCategoryLimit.id, limit.id));
			} else {
				await tx
					.update(monthlyCategoryLimit)
					.set({ category: toName, categoryKey: toKey })
					.where(eq(monthlyCategoryLimit.id, limit.id));
			}
			moved.limits += 1;
		}
		if (fromKey !== toKey) {
			await tx
				.delete(categoryAlertSent)
				.where(
					and(
						eq(categoryAlertSent.userId, userId),
						eq(categoryAlertSent.categoryKey, fromKey),
					),
				);
		}

		// Catalog: the old entry goes (or is renamed), the new one exists.
		const [fromEntry] = await tx
			.select()
			.from(category)
			.where(and(eq(category.userId, userId), eq(category.nameKey, fromKey)));
		const [toEntry] = await tx
			.select()
			.from(category)
			.where(and(eq(category.userId, userId), eq(category.nameKey, toKey)));
		if (fromEntry && toEntry && fromEntry.id !== toEntry.id) {
			await tx.delete(category).where(eq(category.id, fromEntry.id));
		} else if (fromEntry) {
			await tx
				.update(category)
				.set({ name: toName, nameKey: toKey })
				.where(eq(category.id, fromEntry.id));
		} else if (!toEntry) {
			await tx.insert(category).values({ userId, name: toName, nameKey: toKey });
		}

		return moved;
	});

	await rebuildBankExpenses(userId);
	return result;
}

/** Recomputes the stored `expense` rows of bank transactions (category names included). */
export async function rebuildBankExpenses(userId: string) {
	const [item] = await db
		.select({ id: pluggyItems.id })
		.from(pluggyItems)
		.where(eq(pluggyItems.userId, userId))
		.limit(1);
	if (!item) return null;
	return rebuildExpensesFromStoredTransactions({ userId, localItemId: item.id });
}

export async function createCategory(userId: string, rawName: string) {
	const name = cleanCategoryName(rawName);
	const nameKey = normalizeLabel(name);
	const [existing] = await db
		.select()
		.from(category)
		.where(and(eq(category.userId, userId), eq(category.nameKey, nameKey)));
	if (existing)
		throw new AppError(
			"CONFLICT",
			409,
			`Já existe a categoria "${existing.name}" (maiúsculas, acentos e espaços não contam).`,
		);
	const [created] = await db
		.insert(category)
		.values({ userId, name, nameKey })
		.returning();
	return created!;
}

export async function renameCategory(params: {
	userId: string;
	name: string;
	newName: string;
}) {
	const { userId } = params;
	const newName = cleanCategoryName(params.newName);
	const fromKey = normalizeLabel(params.name);
	const toKey = normalizeLabel(newName);
	if (fromKey !== toKey) {
		const [clash] = await db
			.select()
			.from(category)
			.where(and(eq(category.userId, userId), eq(category.nameKey, toKey)));
		if (clash)
			throw new AppError(
				"CONFLICT",
				409,
				`Já existe a categoria "${clash.name}". Para juntar as duas, use merge_categories.`,
			);
	}
	return moveCategory({ userId, from: params.name, to: newName });
}

export async function mergeCategories(params: {
	userId: string;
	from: string;
	into: string;
}) {
	if (normalizeLabel(params.from) === normalizeLabel(params.into))
		throw new AppError("VALIDATION_ERROR", 400, "Origem e destino são a mesma categoria.");
	return moveCategory({ userId: params.userId, from: params.from, to: params.into });
}

export async function archiveCategory(params: {
	userId: string;
	name: string;
	archived: boolean;
}) {
	const name = cleanCategoryName(params.name);
	const nameKey = normalizeLabel(name);
	const [entry] = await db
		.insert(category)
		.values({ userId: params.userId, name, nameKey, archived: params.archived })
		.onConflictDoUpdate({
			target: [category.userId, category.nameKey],
			set: { archived: params.archived },
		})
		.returning();
	return entry!;
}

/**
 * Removes a category. In use, it needs `moveTo` (the same as merging); unused,
 * it just leaves the catalog.
 */
export async function deleteCategory(params: {
	userId: string;
	name: string;
	moveTo?: string;
}) {
	const { userId } = params;
	const key = normalizeLabel(params.name);
	const inUse = await categoryUsageCount(userId, params.name);
	if (inUse > 0) {
		if (!params.moveTo)
			throw new AppError(
				"CONFLICT",
				409,
				`A categoria está em uso (${inUse} itens). Informe moveTo, a categoria que vai ficar com eles.`,
			);
		if (normalizeLabel(params.moveTo) === key)
			throw new AppError("VALIDATION_ERROR", 400, "moveTo precisa ser outra categoria.");
		const moved = await moveCategory({ userId, from: params.name, to: params.moveTo });
		return { deleted: true, moved };
	}
	const removed = await db
		.delete(category)
		.where(and(eq(category.userId, userId), eq(category.nameKey, key)))
		.returning({ id: category.id });
	if (removed.length === 0)
		throw new AppError("NOT_FOUND", 404, "Categoria não encontrada.");
	return { deleted: true, moved: null };
}
