"use client";
import { CATEGORY_COLOR_FALLBACKS, CATEGORY_COLORS, CATEGORY_DOT_COLORS, CATEGORY_DOT_FALLBACKS, CATEGORY_ICON_FALLBACKS, CATEGORY_ICONS, } from "./constants";
function hashCategory(category) {
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
        hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
    }
    return hash;
}
export function getCategoryColor(category) {
    const key = category.trim();
    const mapped = CATEGORY_COLORS[key];
    if (mapped) {
        return mapped;
    }
    const index = hashCategory(key) % CATEGORY_COLOR_FALLBACKS.length;
    return CATEGORY_COLOR_FALLBACKS[index] ?? CATEGORY_COLORS.Outros;
}
export function getCategoryDotColor(category) {
    const key = category.trim();
    const mapped = CATEGORY_DOT_COLORS[key];
    if (mapped) {
        return mapped;
    }
    const index = hashCategory(key) % CATEGORY_DOT_FALLBACKS.length;
    return CATEGORY_DOT_FALLBACKS[index] ?? CATEGORY_DOT_COLORS.Outros;
}
export function getCategoryIcon(category) {
    const key = category.trim();
    const mapped = CATEGORY_ICONS[key];
    if (mapped) {
        return mapped;
    }
    const index = hashCategory(key) % CATEGORY_ICON_FALLBACKS.length;
    return CATEGORY_ICON_FALLBACKS[index] ?? CATEGORY_ICONS.Outros;
}
export function formatBRL(value) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}
export function formatBRLNegative(value) {
    return `-${formatBRL(value).replace("-", "")}`;
}
export function sumExpenses(expenses) {
    return expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
}
