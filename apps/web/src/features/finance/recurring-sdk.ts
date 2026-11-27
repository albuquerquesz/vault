import { useMutation, useQuery } from "@tanstack/react-query";
import { apiFetch, queryClient } from "@/utils/api";

// Mirrors GET/POST/PATCH/DELETE /api/finance/recurring and GET /api/finance/subscriptions.

export type RecurringKind = "bill" | "income";
export type RecurringStatus = "expected" | "realized" | "paid_manual";

export interface RecurringItem {
	id: string;
	kind: RecurringKind;
	name: string;
	amount: number;
	dayOfMonth: number;
	startMonth: string;
	endMonth: string | null;
	category: string;
	matchText: string | null;
}

export interface RecurringOccurrence extends RecurringItem {
	month: string;
	/** `AAAA-MM-DD`, with the day clamped to the month's last day. */
	dueDate: string;
	status: RecurringStatus;
	matchedTransaction: { id: string; date: string; amount: number } | null;
}

export interface RecurringSummary {
	billsPlanned: number;
	billsPending: number;
	incomePlanned: number;
	incomePending: number;
}

export interface RecurringMonth {
	month: string;
	items: RecurringOccurrence[];
	summary: RecurringSummary;
}

export interface RecurringInput {
	kind: RecurringKind;
	name: string;
	amount: number;
	dayOfMonth: number;
	startMonth?: string;
	endMonth?: string | null;
	category: string;
	matchText?: string | null;
}

export interface RecurringPatchInput {
	id: string;
	name?: string;
	amount?: number;
	dayOfMonth?: number;
	category?: string;
	matchText?: string | null;
	endMonth?: string | null;
	/** Changes apply from this month on; earlier months keep the old terms. */
	effectiveFrom?: string;
}

export interface DetectedSubscription {
	name: string;
	amount: number;
	category: string | null;
	accountName: string | null;
	cadence: "monthly";
	confidence: "high" | "medium";
	occurrences: number;
	firstChargeDate: string;
	lastChargeDate: string;
	nextExpectedDate: string;
	source: "pluggy" | "cash";
}

export interface SubscriptionsResult {
	asOf: string;
	windowMonths: number;
	monthlyTotal: number;
	subscriptions: DetectedSubscription[];
}

function invalidateRecurring() {
	return Promise.all([
		queryClient.invalidateQueries({ queryKey: ["recurring"] }),
		queryClient.invalidateQueries({ queryKey: ["projection"] }),
	]);
}

export function useRecurringMonth(month: string) {
	return useQuery({
		queryKey: ["recurring", "month", month],
		queryFn: () =>
			apiFetch<RecurringMonth>(
				`/api/finance/recurring?month=${encodeURIComponent(month)}`,
			),
	});
}

/** Every item, including the ended ones. */
export function useAllRecurringItems() {
	return useQuery({
		queryKey: ["recurring", "all"],
		queryFn: () =>
			apiFetch<{ items: RecurringItem[] }>("/api/finance/recurring?all=true"),
	});
}

export function useSubscriptions() {
	return useQuery({
		queryKey: ["subscriptions"],
		queryFn: () => apiFetch<SubscriptionsResult>("/api/finance/subscriptions"),
	});
}

export function useCreateRecurring() {
	return useMutation({
		mutationFn: (input: RecurringInput) =>
			apiFetch<RecurringItem>("/api/finance/recurring", {
				method: "POST",
				body: input,
			}),
		onSuccess: invalidateRecurring,
	});
}

export function useUpdateRecurring() {
	return useMutation({
		mutationFn: ({ id, ...body }: RecurringPatchInput) =>
			apiFetch<{ item: RecurringItem; previous: RecurringItem | null }>(
				`/api/finance/recurring/${id}`,
				{ method: "PATCH", body },
			),
		onSuccess: invalidateRecurring,
	});
}

export function useDeleteRecurring() {
	return useMutation({
		mutationFn: (id: string) =>
			apiFetch<{ deleted: number }>(`/api/finance/recurring/${id}`, {
				method: "DELETE",
			}),
		onSuccess: invalidateRecurring,
	});
}

export function useSetRecurringPaid() {
	return useMutation({
		mutationFn: ({
			id,
			month,
			paid,
		}: {
			id: string;
			month: string;
			paid: boolean;
		}) =>
			apiFetch(`/api/finance/recurring/${id}/paid`, {
				method: paid ? "POST" : "DELETE",
				body: { month },
			}),
		onSuccess: invalidateRecurring,
	});
}
