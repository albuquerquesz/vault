"use client";

import type { LucideIcon } from "lucide-react";
import type { FinanceExpense } from "@/features/finance/sdk";
import {
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
