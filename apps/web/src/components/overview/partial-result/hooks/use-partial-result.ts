"use client";

import { useMemo } from "react";
import { useFinancePartialResult } from "@/features/finance/sdk";

export type PartialResultMetrics = {
	income: number;
	spent: number;
	result: number;
	previousResult: number;
	/** Null when previous result is 0 (no meaningful % change). */
	changePercent: number | null;
};

export function usePartialResult(month: string) {
	const query = useFinancePartialResult(month);

	const metrics = useMemo<PartialResultMetrics | null>(() => {
		if (!query.data) {
			return null;
		}

		return {
			income: query.data.income,
			spent: query.data.spent,
			result: query.data.result,
			previousResult: query.data.previousResult,
			changePercent: query.data.changePercent,
		};
	}, [query.data]);

	return {
		metrics,
		isLoading: query.isPending,
		isError: query.isError,
	};
}
