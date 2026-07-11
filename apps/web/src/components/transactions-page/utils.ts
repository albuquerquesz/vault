"use client";

import type { FinanceExpense } from "@/features/finance/sdk";
import { CATEGORY_COLORS, CATEGORY_DOT_COLORS } from "./constants";

export type TransactionsMonthOption = {
  value: string;
  label: string;
};

export type TransactionsActiveFilterChip = {
  label: string;
  onRemove: () => void;
};

export function getCategoryColor(category: string) {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Outros;
}

export function getCategoryDotColor(category: string) {
  return CATEGORY_DOT_COLORS[category] ?? CATEGORY_DOT_COLORS.Outros;
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
