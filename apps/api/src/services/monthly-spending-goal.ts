export type MonthlySpendingGoalCalculation = {
	remainingAmount: number | null;
	dailyLimit: number | null;
	isOverTarget: boolean;
};

/** Derives the daily allowance from the monthly ceiling and current spend. */
export function calculateMonthlySpendingGoal(params: {
	targetAmount: number | null;
	spent: number;
	remainingDays: number;
}): MonthlySpendingGoalCalculation {
	const { targetAmount, spent, remainingDays } = params;

	if (targetAmount === null) {
		return {
			remainingAmount: null,
			dailyLimit: null,
			isOverTarget: false,
		};
	}

	const safeSpent = Number.isFinite(spent) ? Math.max(spent, 0) : 0;
	const remainingAmount = targetAmount - safeSpent;
	const isOverTarget = safeSpent > targetAmount;

	return {
		remainingAmount,
		dailyLimit:
			remainingDays > 0 ? Math.max(remainingAmount, 0) / remainingDays : null,
		isOverTarget,
	};
}
