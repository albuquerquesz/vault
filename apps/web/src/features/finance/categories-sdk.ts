import { useMutation, useQuery } from "@tanstack/react-query";
import { apiFetch, queryClient } from "@/utils/api";

// Mirrors the category limit, category rule, category and tag routes under /api/finance.

export interface CategoryLimitStatus {
	category: string;
	targetAmount: number;
	spent: number;
	remaining: number;
	percentUsed: number;
	isOver: boolean;
}

export interface CategoryLimits {
	month: string;
	limits: CategoryLimitStatus[];
}

export type RuleMatchType = "contains" | "starts_with" | "equals";

export interface CategoryRule {
	id: string;
	matchType: RuleMatchType;
	pattern: string;
	category: string;
	priority: number;
	enabled: boolean;
}

export interface CategoryRuleInput {
	matchType: RuleMatchType;
	pattern: string;
	category: string;
}

export interface RulePreview {
	matched: number;
	wouldChange: number;
	examples: Array<{
		id: string;
		date: string;
		description: string;
		amount: number;
		currentCategory: string;
	}>;
}

export interface CategoryEntry {
	category: string;
	kind: "expense" | "income" | string;
	count: number;
	id: string | null;
	archived: boolean;
}

export interface TagEntry {
	id: string;
	name: string;
	transactions: number;
}

const limitsKey = (month: string) => ["categoryLimits", month] as const;

function invalidate(...keys: string[]) {
	return Promise.all(
		keys.map((key) => queryClient.invalidateQueries({ queryKey: [key] })),
	);
}

export function useCategoryLimits(month: string) {
	return useQuery({
		queryKey: limitsKey(month),
		queryFn: () =>
			apiFetch<CategoryLimits>(
				`/api/finance/category-limits?month=${encodeURIComponent(month)}`,
			),
	});
}

export function useUpsertCategoryLimit(month: string) {
	return useMutation({
		mutationFn: (input: { category: string; targetAmount: number }) =>
			apiFetch("/api/finance/category-limits", {
				method: "POST",
				body: { month, ...input },
			}),
		onSuccess: () => invalidate("categoryLimits"),
	});
}

export function useDeleteCategoryLimit(month: string) {
	return useMutation({
		mutationFn: (category: string) =>
			apiFetch("/api/finance/category-limits", {
				method: "DELETE",
				body: { month, category },
			}),
		onSuccess: () => invalidate("categoryLimits"),
	});
}

export function useCopyCategoryLimits() {
	return useMutation({
		mutationFn: (input: { fromMonth: string; toMonth: string }) =>
			apiFetch<{ copied: number; skipped: number }>(
				"/api/finance/category-limits/copy",
				{ method: "POST", body: input },
			),
		onSuccess: () => invalidate("categoryLimits"),
	});
}

export function useCategoryRules() {
	return useQuery({
		queryKey: ["categoryRules"],
		queryFn: () => apiFetch<CategoryRule[]>("/api/finance/category-rules"),
	});
}

export function useCreateCategoryRule() {
	return useMutation({
		mutationFn: (input: CategoryRuleInput) =>
			apiFetch<CategoryRule>("/api/finance/category-rules", {
				method: "POST",
				body: input,
			}),
		onSuccess: () =>
			invalidate("categoryRules", "categoryLimits", "expenses", "transactions", "categories"),
	});
}

export function useDeleteCategoryRule() {
	return useMutation({
		mutationFn: (id: string) =>
			apiFetch<{ deleted: number }>(`/api/finance/category-rules/${id}`, {
				method: "DELETE",
			}),
		onSuccess: () =>
			invalidate("categoryRules", "categoryLimits", "expenses", "transactions", "categories"),
	});
}

export function usePreviewCategoryRule() {
	return useMutation({
		mutationFn: (input: CategoryRuleInput) =>
			apiFetch<RulePreview>("/api/finance/category-rules/preview", {
				method: "POST",
				body: input,
			}),
	});
}

export function useCategoryCatalog() {
	return useQuery({
		queryKey: ["categories"],
		queryFn: () => apiFetch<CategoryEntry[]>("/api/finance/categories"),
	});
}

function invalidateCategories() {
	return invalidate(
		"categories",
		"categoryRules",
		"categoryLimits",
		"expenses",
		"transactions",
	);
}

export function useCreateCategory() {
	return useMutation({
		mutationFn: (name: string) =>
			apiFetch("/api/finance/categories", { method: "POST", body: { name } }),
		onSuccess: invalidateCategories,
	});
}

export function useRenameCategory() {
	return useMutation({
		mutationFn: (input: { name: string; newName: string }) =>
			apiFetch("/api/finance/categories/rename", {
				method: "POST",
				body: input,
			}),
		onSuccess: invalidateCategories,
	});
}

export function useDeleteCategory() {
	return useMutation({
		mutationFn: (input: { name: string; moveTo?: string }) =>
			apiFetch("/api/finance/categories", { method: "DELETE", body: input }),
		onSuccess: invalidateCategories,
	});
}

export function useTags() {
	return useQuery({
		queryKey: ["tags"],
		queryFn: () => apiFetch<TagEntry[]>("/api/finance/tags"),
	});
}

export function useCreateTag() {
	return useMutation({
		mutationFn: (name: string) =>
			apiFetch<{ id: string; name: string }>("/api/finance/tags", {
				method: "POST",
				body: { name },
			}),
		onSuccess: () => invalidate("tags"),
	});
}

export function useDeleteTag() {
	return useMutation({
		mutationFn: (id: string) =>
			apiFetch<{ deleted: number }>(`/api/finance/tags/${id}`, {
				method: "DELETE",
			}),
		onSuccess: () => invalidate("tags", "transactions"),
	});
}
