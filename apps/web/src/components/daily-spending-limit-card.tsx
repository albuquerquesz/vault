"use client";

import { MonthlySpendingGoalCard } from "@/components/monthly-spending-goal-card";
import { getMonthValue } from "@/features/finance/sdk";

/**
 * Compatibility wrapper for older dashboard compositions.
 * The daily limit now comes from the monthly spending goal and is calculated
 * against the remaining balance, including Pluggy transactions.
 */
function DailySpendingLimitCard() {
	return <MonthlySpendingGoalCard month={getMonthValue()} />;
}

export { DailySpendingLimitCard };
