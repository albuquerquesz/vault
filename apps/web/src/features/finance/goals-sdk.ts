import { useMutation, useQuery } from "@tanstack/react-query";
import { apiFetch, queryClient } from "@/utils/api";

// Mirrors GET /api/finance/goals/:id/plan and /contributions (spec 12).
// The goal list and CRUD stay in sdk.ts (goalsSdk).

export interface GoalPlan {
	goalId: string;
	name: string;
	targetAmount: number;
	currentAmount: number;
	remaining: number;
	isComplete: boolean;
	targetDate: string | null;
	/** Months from the current one to the deadline's month, both included. */
	monthsLeft: number | null;
	/** What to put aside each remaining month; null without a deadline. */
	perMonth: number | null;
	isPastDue: boolean;
}

export interface GoalContribution {
	id: string;
	goalId: string;
	amount: number;
	kind: "deposit" | "withdrawal";
	date: string;
	note: string | null;
}

function invalidateGoals() {
	return Promise.all(
		["goals", "goalPlan", "goalContributions"].map((key) =>
			queryClient.invalidateQueries({ queryKey: [key] }),
		),
	);
}

export function useGoalPlan(goal: {
	id: string;
	targetAmount: number;
	currentAmount: number;
	targetDate?: string | null;
}) {
	return useQuery({
		// The amounts and the deadline are in the key so an edit refetches the plan.
		queryKey: [
			"goalPlan",
			goal.id,
			goal.targetAmount,
			goal.currentAmount,
			goal.targetDate ?? null,
		],
		queryFn: () => apiFetch<GoalPlan>(`/api/finance/goals/${goal.id}/plan`),
	});
}

export function useGoalContributions(goalId: string, enabled = true) {
	return useQuery({
		queryKey: ["goalContributions", goalId],
		queryFn: () =>
			apiFetch<GoalContribution[]>(`/api/finance/goals/${goalId}/contributions`),
		enabled,
	});
}

export function useAddGoalContribution() {
	return useMutation({
		mutationFn: ({
			goalId,
			...body
		}: {
			goalId: string;
			amount: number;
			kind: "deposit" | "withdrawal";
			date?: string;
			note?: string;
		}) =>
			apiFetch(`/api/finance/goals/${goalId}/contributions`, {
				method: "POST",
				body,
			}),
		onSuccess: invalidateGoals,
	});
}

export function useDeleteGoalContribution() {
	return useMutation({
		mutationFn: ({
			goalId,
			contributionId,
		}: {
			goalId: string;
			contributionId: string;
		}) =>
			apiFetch(
				`/api/finance/goals/${goalId}/contributions/${contributionId}`,
				{ method: "DELETE" },
			),
		onSuccess: invalidateGoals,
	});
}
