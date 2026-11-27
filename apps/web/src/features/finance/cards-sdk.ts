import { useMutation, useQuery } from "@tanstack/react-query";
import { apiFetch, queryClient } from "@/utils/api";

// Mirrors GET /api/finance/installments and POST/DELETE /api/finance/bills/:id/paid.

export interface InstallmentPlan {
	name: string;
	cardName: string | null;
	accountId: string;
	totalInstallments: number;
	/** The last installment seen so far. */
	lastNumber: number;
	lastDate: string;
	installmentAmount: number;
	remainingInstallments: number;
	remainingAmount: number;
	nextExpectedDate: string | null;
	isComplete: boolean;
}

export interface UpcomingInstallmentMonth {
	month: string;
	total: number;
	count: number;
	items: {
		name: string;
		cardName: string | null;
		installmentNumber: number;
		totalInstallments: number;
		amount: number;
	}[];
}

export interface InstallmentsResult {
	plans: InstallmentPlan[];
	upcoming: UpcomingInstallmentMonth[];
	summary: {
		activePlans: number;
		remainingInstallments: number;
		remainingAmount: number;
	};
}

export function useInstallments(months = 6) {
	return useQuery({
		queryKey: ["installments", months],
		queryFn: () =>
			apiFetch<InstallmentsResult>(`/api/finance/installments?months=${months}`),
	});
}

function invalidateBills() {
	return Promise.all(
		["monthlyBills", "overview", "projection"].map((key) =>
			queryClient.invalidateQueries({ queryKey: [key] }),
		),
	);
}

/** Manual mark: kept apart from the Pluggy data, which the sync keeps rewriting. */
export function useSetBillPaid() {
	return useMutation({
		mutationFn: ({
			pluggyBillId,
			paid,
		}: {
			pluggyBillId: string;
			paid: boolean;
		}) =>
			apiFetch(`/api/finance/bills/${encodeURIComponent(pluggyBillId)}/paid`, {
				method: paid ? "POST" : "DELETE",
			}),
		onSuccess: invalidateBills,
	});
}
