"use client";

import type { FinanceExpense } from "@/features/finance/sdk";
import type { LucideIcon } from "lucide-react";
import {
	CATEGORY_COLOR_FALLBACKS,
	CATEGORY_COLORS,
	CATEGORY_DOT_COLORS,
	CATEGORY_DOT_FALLBACKS,
	CATEGORY_ICON_FALLBACKS,
	CATEGORY_ICONS,
} from "./constants";

export type TransactionsMonthOption = {
	value: string;
	label: string;
};

export type TransactionsActiveFilterChip = {
	label: string;
	onRemove: () => void;
};

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
