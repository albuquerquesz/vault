"use client";

import type { LucideIcon } from "lucide-react";
import type { FinanceExpense } from "@/features/finance/sdk";
import {
	CATEGORY_BAR_FALLBACKS,
	CATEGORY_BAR_FILLS,
	CATEGORY_COLOR_FALLBACKS,
	CATEGORY_COLORS,
	CATEGORY_DOT_COLORS,
	CATEGORY_DOT_FALLBACKS,
	CATEGORY_ICON_FALLBACKS,
	CATEGORY_ICONS,
} from "./constants";

function hashCategory(category: string) {
	let hash = 0;
	for (let i = 0; i < category.length; i++) {
		hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
	}
	return hash;
}

export function getCategoryColor(category: string) {
	const key = category.trim();
	const mapped = CATEGORY_COLORS[key];
	if (mapped) {
		return mapped;
	}

	const index = hashCategory(key) % CATEGORY_COLOR_FALLBACKS.length;
	return CATEGORY_COLOR_FALLBACKS[index] ?? CATEGORY_COLORS.Outros;
}

export function getCategoryDotColor(category: string) {
	const key = category.trim();
	const mapped = CATEGORY_DOT_COLORS[key];
	if (mapped) {
		return mapped;
	}

	const index = hashCategory(key) % CATEGORY_DOT_FALLBACKS.length;
	return CATEGORY_DOT_FALLBACKS[index] ?? CATEGORY_DOT_COLORS.Outros;
}

/** Solid fill color for category chart bars (matches badge/dot hues). */
export function getCategoryBarFill(category: string) {
	const key = category.trim();
	const mapped = CATEGORY_BAR_FILLS[key];
	if (mapped) {
		return mapped;
	}

	const index = hashCategory(key) % CATEGORY_BAR_FALLBACKS.length;
	return CATEGORY_BAR_FALLBACKS[index] ?? CATEGORY_BAR_FILLS.Outros;
}

export function getCategoryIcon(category: string): LucideIcon {
	const key = category.trim();
	const mapped = CATEGORY_ICONS[key];
	if (mapped) {
		return mapped;
	}

	const index = hashCategory(key) % CATEGORY_ICON_FALLBACKS.length;
	return CATEGORY_ICON_FALLBACKS[index] ?? CATEGORY_ICONS.Outros;
}

/** Local calendar YYYY-MM-DD (noon-anchored strings elsewhere use this key shape). */
function localDateKey(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

/**
 * Day section label for the transactions feed.
 * HOJE / ONTEM / "DOM, JUL 12" style (pt-BR, uppercase).
 */
export function formatTransactionDayLabel(expenseDate: string): string {
	const key = expenseDate.slice(0, 10);
	const today = new Date();
	const todayKey = localDateKey(today);
	if (key === todayKey) {
		return "HOJE";
	}

	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - 1);
	if (key === localDateKey(yesterday)) {
		return "ONTEM";
	}

	const date = new Date(`${key}T12:00:00`);
	const weekday = date
		.toLocaleDateString("pt-BR", { weekday: "short" })
		.replace(/\./g, "")
		.trim();
	const month = date
		.toLocaleDateString("pt-BR", { month: "short" })
		.replace(/\./g, "")
		.trim();
	const day = date.getDate();

	return `${weekday}, ${month} ${day}`.toUpperCase();
}

export function formatBRL(value: number) {
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);
}

export function formatBRLNegative(value: number) {
	return `-${formatBRL(value).replace("-", "")}`;
}

export function sumExpenses(expenses: FinanceExpense[]) {
	return expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
}

/** Previous calendar month as `YYYY-MM` relative to a month key or Date. */
export function getPreviousMonthValue(monthOrDate: string | Date = new Date()): string {
	const date =
		typeof monthOrDate === "string"
			? new Date(`${monthOrDate.slice(0, 7)}-01T12:00:00`)
			: new Date(monthOrDate);
	date.setMonth(date.getMonth() - 1);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	return `${year}-${month}`;
}

/** Keep expenses on or after the local calendar day `days` ago (inclusive of today). */
export function filterLastNDays(
	expenses: FinanceExpense[],
	days: number,
	now = new Date(),
): FinanceExpense[] {
	const cutoff = new Date(now);
	cutoff.setHours(12, 0, 0, 0);
	cutoff.setDate(cutoff.getDate() - (days - 1));
	const cutoffKey = localDateKey(cutoff);

	return expenses.filter((expense) => expense.expenseDate.slice(0, 10) >= cutoffKey);
}

export type TransactionsPeriodStats = {
	count: number;
	totalOut: number;
	totalIn: number;
};

export function buildPeriodStats(
	expenses: FinanceExpense[],
): TransactionsPeriodStats {
	return {
		count: expenses.length,
		totalOut: sumExpenses(expenses),
		// Expenses-only dataset today; reserved for future income.
		totalIn: 0,
	};
}

export type TransactionsFilters = {
	accounts: string[];
	dates: string[];
	categories: string[];
};

export const EMPTY_TRANSACTIONS_FILTERS: TransactionsFilters = {
	accounts: [],
	dates: [],
	categories: [],
};

export function getExpenseAccountKey(expense: FinanceExpense): string {
	const name = expense.sourceAccountName?.trim();
	return name && name.length > 0 ? name : "Sem conta";
}

export function hasActiveTransactionFilters(filters: TransactionsFilters): boolean {
	return (
		filters.accounts.length > 0 ||
		filters.dates.length > 0 ||
		filters.categories.length > 0
	);
}

export function applyTransactionFilters(
	expenses: FinanceExpense[],
	filters: TransactionsFilters,
): FinanceExpense[] {
	let next = expenses;

	if (filters.accounts.length > 0) {
		const accounts = new Set(filters.accounts);
		next = next.filter((expense) => accounts.has(getExpenseAccountKey(expense)));
	}

	if (filters.dates.length > 0) {
		const dates = new Set(filters.dates.map((date) => date.slice(0, 10)));
		next = next.filter((expense) =>
			dates.has(expense.expenseDate.slice(0, 10)),
		);
	}

	if (filters.categories.length > 0) {
		const categories = new Set(filters.categories);
		next = next.filter((expense) => categories.has(expense.category));
	}

	return next;
}

export function collectFilterOptions(expenses: FinanceExpense[]) {
	const accounts = new Set<string>();
	const dates = new Set<string>();
	const categories = new Set<string>();

	for (const expense of expenses) {
		accounts.add(getExpenseAccountKey(expense));
		dates.add(expense.expenseDate.slice(0, 10));
		if (expense.category?.trim()) {
			categories.add(expense.category.trim());
		}
	}

	return {
		accounts: Array.from(accounts).sort((left, right) =>
			left.localeCompare(right, "pt-BR"),
		),
		dates: Array.from(dates).sort((left, right) => right.localeCompare(left)),
		categories: Array.from(categories).sort((left, right) =>
			left.localeCompare(right, "pt-BR"),
		),
	};
}
