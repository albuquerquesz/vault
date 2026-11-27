import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/utils/api";

// Mirrors GET /api/finance/projection (apps/api balance-projection service).

export type ProjectionCertainty = "fact" | "registered" | "estimate";

export type ProjectionEventKind =
	| "income"
	| "fixed_bill"
	| "closed_card_bill"
	| "open_card_bill"
	| "installments"
	| "card_spending"
	| "variable";

export interface ProjectionEvent {
	date: string;
	kind: ProjectionEventKind;
	label: string;
	/** Signed: positive is money in, negative is money out. */
	amount: number;
	certainty: ProjectionCertainty;
}

export interface ProjectionMonth {
	month: string;
	income: number;
	fixedBills: number;
	closedCardBills: number;
	openCardBill: number;
	installments: number;
	cardSpending: number;
	variable: number;
	outflow: number;
	net: number;
	endBalance: number;
	lowestBalance: number;
}

export interface ProjectionPoint {
	date: string;
	balance: number;
}

export interface ProjectionAssumption {
	code: string;
	kind: ProjectionCertainty | "warning";
	text: string;
}

export interface BalanceProjection {
	isEstimate: true;
	today: string;
	startBalance: number | null;
	months: ProjectionMonth[];
	lowest: ProjectionPoint | null;
	firstNegativeMonth: string | null;
	firstNegativeDate: string | null;
	events: ProjectionEvent[];
	assumptions: ProjectionAssumption[];
}

export const PROJECTION_HORIZONS = [3, 6, 12] as const;
export type ProjectionHorizon = (typeof PROJECTION_HORIZONS)[number];

export const projectionSdk = {
	queryOptions: (months: number) =>
		({
			queryKey: ["projection", months],
			queryFn: () =>
				apiFetch<BalanceProjection>(`/api/finance/projection?months=${months}`),
		}) as const,
};

export function useBalanceProjection(months: number) {
	return useQuery(projectionSdk.queryOptions(months));
}
