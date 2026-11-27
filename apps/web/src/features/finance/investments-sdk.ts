import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/utils/api";

// Mirrors GET /api/finance/investments and /investments/history.

export interface InvestmentPosition {
	id: string;
	name: string;
	type: string;
	subtype: string | null;
	institution: string | null;
	amountInvested: number | null;
	balance: number;
	currency: string;
	status: string | null;
	date: string | null;
	returnAmount: number | null;
	returnPercent: number | null;
	percent: number | null;
}

export interface Portfolio {
	totalBalance: number;
	totalInvested: number;
	balanceWithBasis: number;
	returnAmount: number | null;
	returnPercent: number | null;
	byType: {
		type: string;
		label: string;
		balance: number;
		percent: number;
		count: number;
	}[];
	positions: InvestmentPosition[];
	otherCurrencyCount: number;
	redeemedCount: number;
}

export function usePortfolio() {
	return useQuery({
		queryKey: ["investments"],
		queryFn: () => apiFetch<Portfolio>("/api/finance/investments"),
		// A missing Pluggy product is not worth hammering the endpoint.
		retry: 1,
	});
}

export interface InvestmentSnapshot {
	month: string;
	totalBalance: number;
}

export function useInvestmentHistory() {
	return useQuery({
		queryKey: ["investments", "history"],
		queryFn: () =>
			apiFetch<{ snapshots: InvestmentSnapshot[] }>(
				"/api/finance/investments/history",
			),
		retry: 1,
	});
}
