"use client";

import type { LucideIcon } from "lucide-react";
import {
	Car,
	CreditCard,
	Fuel,
	Funnel,
	GraduationCap,
	HeartPulse,
	Home,
	Landmark,
	Pill,
	Plane,
	ShoppingBag,
	ShoppingCart,
	Sparkles,
	Tag,
	UtensilsCrossed,
	Wrench,
} from "lucide-react";

export const CATEGORIES = [
	"Moradia",
	"Alimentação",
	"Transporte",
	"Saúde",
	"Lazer",
	"Outros",
];

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
	// Manual / finance seed (pt-BR)
	Moradia: Home,
	Alimentação: UtensilsCrossed,
	Transporte: Car,
	Saúde: HeartPulse,
	Lazer: Sparkles,
	Outros: Tag,

	// Pluggy / enrichment (en)
	"Food delivery": UtensilsCrossed,
	Groceries: ShoppingCart,
	"Gas stations": Fuel,
	Healthcare: HeartPulse,
	Pharmacy: Pill,
	Shopping: ShoppingBag,
	Restaurants: UtensilsCrossed,
	Transport: Car,
	Transfers: Landmark,
	Entertainment: Sparkles,
	Education: GraduationCap,
	Services: Wrench,
	Travel: Plane,
	"Credit card payment": CreditCard,
};

/** Fallback icons for unknown categories (stable by name hash). */
export const CATEGORY_ICON_FALLBACKS = [
	Tag,
	Funnel,
	ShoppingBag,
	Car,
	HeartPulse,
	Sparkles,
	UtensilsCrossed,
	Home,
] as const;

/** Soft badge styles (bg + text + border) — aligned with overview category accents. */
export const CATEGORY_COLORS: Record<string, string> = {
	// Manual / finance seed (pt-BR)
	Moradia:
		"bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400",
	Alimentação:
		"bg-orange-500/15 text-orange-600 border-orange-500/30 dark:text-orange-400",
	Transporte:
		"bg-blue-500/15 text-blue-600 border-blue-500/30 dark:text-blue-400",
	Saúde: "bg-red-500/15 text-red-600 border-red-500/30 dark:text-red-400",
	Lazer:
		"bg-purple-500/15 text-purple-600 border-purple-500/30 dark:text-purple-400",
	Outros: "bg-zinc-500/15 text-zinc-600 border-zinc-500/30 dark:text-zinc-400",

	// Pluggy / enrichment (en)
	"Food delivery":
		"bg-orange-500/15 text-orange-600 border-orange-500/30 dark:text-orange-400",
	Groceries:
		"bg-lime-500/15 text-lime-700 border-lime-500/30 dark:text-lime-400",
	"Gas stations":
		"bg-blue-500/15 text-blue-600 border-blue-500/30 dark:text-blue-400",
	Healthcare:
		"bg-rose-500/15 text-rose-600 border-rose-500/30 dark:text-rose-400",
	Pharmacy:
		"bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400",
	Shopping:
		"bg-fuchsia-500/15 text-fuchsia-600 border-fuchsia-500/30 dark:text-fuchsia-400",
	Restaurants:
		"bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400",
	Transport: "bg-sky-500/15 text-sky-600 border-sky-500/30 dark:text-sky-400",
	Transfers:
		"bg-slate-500/15 text-slate-600 border-slate-500/30 dark:text-slate-400",
	Entertainment:
		"bg-violet-500/15 text-violet-600 border-violet-500/30 dark:text-violet-400",
	Education:
		"bg-indigo-500/15 text-indigo-600 border-indigo-500/30 dark:text-indigo-400",
	Services:
		"bg-cyan-500/15 text-cyan-700 border-cyan-500/30 dark:text-cyan-400",
	Travel: "bg-teal-500/15 text-teal-700 border-teal-500/30 dark:text-teal-400",
	"Credit card payment":
		"bg-zinc-500/15 text-zinc-600 border-zinc-500/30 dark:text-zinc-400",
};

/** Dot markers (overview-style solid accents). */
export const CATEGORY_DOT_COLORS: Record<string, string> = {
	Moradia: "bg-amber-500",
	Alimentação: "bg-orange-500",
	Transporte: "bg-blue-500",
	Saúde: "bg-red-500",
	Lazer: "bg-purple-500",
	Outros: "bg-zinc-500",
	"Food delivery": "bg-orange-500",
	Groceries: "bg-lime-500",
	"Gas stations": "bg-blue-500",
	Healthcare: "bg-rose-500",
	Pharmacy: "bg-emerald-500",
	Shopping: "bg-fuchsia-500",
	Restaurants: "bg-amber-500",
	Transport: "bg-sky-500",
	Transfers: "bg-slate-500",
	Entertainment: "bg-violet-500",
	Education: "bg-indigo-500",
	Services: "bg-cyan-500",
	Travel: "bg-teal-500",
	"Credit card payment": "bg-zinc-500",
};

/** Fallback palette for unknown Pluggy categories (stable by name hash). */
export const CATEGORY_COLOR_FALLBACKS = [
	"bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400",
	"bg-orange-500/15 text-orange-600 border-orange-500/30 dark:text-orange-400",
	"bg-blue-500/15 text-blue-600 border-blue-500/30 dark:text-blue-400",
	"bg-rose-500/15 text-rose-600 border-rose-500/30 dark:text-rose-400",
	"bg-purple-500/15 text-purple-600 border-purple-500/30 dark:text-purple-400",
	"bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400",
	"bg-cyan-500/15 text-cyan-700 border-cyan-500/30 dark:text-cyan-400",
	"bg-fuchsia-500/15 text-fuchsia-600 border-fuchsia-500/30 dark:text-fuchsia-400",
	"bg-lime-500/15 text-lime-700 border-lime-500/30 dark:text-lime-400",
	"bg-sky-500/15 text-sky-600 border-sky-500/30 dark:text-sky-400",
] as const;

export const CATEGORY_DOT_FALLBACKS = [
	"bg-amber-500",
	"bg-orange-500",
	"bg-blue-500",
	"bg-rose-500",
	"bg-purple-500",
	"bg-emerald-500",
	"bg-cyan-500",
	"bg-fuchsia-500",
	"bg-lime-500",
	"bg-sky-500",
] as const;

/**
 * Solid chart fills (hex) aligned with badge/dot accents above.
 * Tailwind-500 equivalents for recharts `fill` (SVG cannot use `bg-*` classes).
 */
export const CATEGORY_BAR_FILLS: Record<string, string> = {
	Moradia: "#f59e0b", // amber-500
	Alimentação: "#f97316", // orange-500
	Transporte: "#3b82f6", // blue-500
	Saúde: "#ef4444", // red-500
	Lazer: "#a855f7", // purple-500
	Outros: "#71717a", // zinc-500
	"Food delivery": "#f97316", // orange-500
	Groceries: "#84cc16", // lime-500
	"Gas stations": "#3b82f6", // blue-500
	Healthcare: "#f43f5e", // rose-500
	Pharmacy: "#10b981", // emerald-500
	Shopping: "#d946ef", // fuchsia-500
	Restaurants: "#f59e0b", // amber-500
	Transport: "#0ea5e9", // sky-500
	Transfers: "#64748b", // slate-500
	Entertainment: "#8b5cf6", // violet-500
	Education: "#6366f1", // indigo-500
	Services: "#06b6d4", // cyan-500
	Travel: "#14b8a6", // teal-500
	"Credit card payment": "#71717a", // zinc-500
};

export const CATEGORY_BAR_FALLBACKS = [
	"#f59e0b", // amber
	"#f97316", // orange
	"#3b82f6", // blue
	"#f43f5e", // rose
	"#a855f7", // purple
	"#10b981", // emerald
	"#06b6d4", // cyan
	"#d946ef", // fuchsia
	"#84cc16", // lime
	"#0ea5e9", // sky
] as const;
