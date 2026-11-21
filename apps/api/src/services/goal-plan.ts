export type GoalPlan = {
	remaining: number;
	isComplete: boolean;
	targetDate: string | null;
	/** Months from the current one to the deadline's month, both included. */
	monthsLeft: number | null;
	/** What to put aside each remaining month to reach the target; null without a deadline. */
	perMonth: number | null;
	isPastDue: boolean;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * How much to save per month to reach a goal by its deadline. No interest. The
 * monthly amount rounds up to the cent so the months add up to the target.
 */
export function planGoal(params: {
	targetAmount: number;
	currentAmount: number;
	targetDate: string | null | undefined;
	/** `AAAA-MM-DD`. */
	today: string;
}): GoalPlan {
	const { targetAmount, currentAmount, today } = params;
	const targetDate = params.targetDate ?? null;
	const remaining = round2(Math.max(targetAmount - currentAmount, 0));
	const isComplete = currentAmount >= targetAmount;

	if (!targetDate) {
		return {
			remaining,
			isComplete,
			targetDate: null,
			monthsLeft: null,
			perMonth: null,
			isPastDue: false,
		};
	}

	const [ty = 0, tm = 0] = targetDate.split("-").map(Number);
	const [cy = 0, cm = 0] = today.split("-").map(Number);
	const monthsLeft = Math.max((ty - cy) * 12 + (tm - cm) + 1, 0);

	if (isComplete) {
		return {
			remaining: 0,
			isComplete,
			targetDate,
			monthsLeft,
			perMonth: 0,
			isPastDue: false,
		};
	}

	return {
		remaining,
		isComplete,
		targetDate,
		monthsLeft,
		// Past the deadline's month nothing is left to spread over: it is all due now.
		perMonth:
			monthsLeft > 0 ? Math.ceil((remaining * 100) / monthsLeft) / 100 : remaining,
		isPastDue: today > targetDate,
	};
}

/** The goal's new current amount after adding or undoing a movement. */
export function applyContribution(params: {
	currentAmount: number;
	amount: number;
	kind: "deposit" | "withdrawal";
	/** `true` to undo it instead. */
	undo?: boolean;
}): number {
	const sign = (params.kind === "deposit" ? 1 : -1) * (params.undo ? -1 : 1);
	return round2(params.currentAmount + sign * params.amount);
}
