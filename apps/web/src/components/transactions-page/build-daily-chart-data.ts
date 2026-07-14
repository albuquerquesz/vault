import type { FinanceExpense } from "@/features/finance/sdk";

export type TransactionsDailyChartPoint = {
	/** Local noon for the calendar day (stable time-scale ticks). */
	date: Date;
	/** Total spent that day (BRL). */
	amount: number;
};

function daysInMonth(month: string): number {
	const [year, monthNumber] = month.split("-").map(Number);
	if (!year || !monthNumber) {
		return 0;
	}
	return new Date(year, monthNumber, 0).getDate();
}

function dayNumberFromExpenseDate(expenseDate: string): number | null {
	const dayPart = expenseDate.slice(8, 10);
	const dayNumber = Number(dayPart);
	if (!Number.isFinite(dayNumber) || dayNumber < 1 || dayNumber > 31) {
		return null;
	}
	return dayNumber;
}

/** Aggregate expenses into a continuous daily series for the AreaChart. */
export function buildDailyChartData(
	month: string,
	expenses: FinanceExpense[],
): TransactionsDailyChartPoint[] {
	const [year, monthNumber] = month.split("-").map(Number);
	const totalDays = daysInMonth(month);
	if (!year || !monthNumber || totalDays <= 0) {
		return [];
	}

	const amounts = new Array<number>(totalDays).fill(0);

	for (const expense of expenses) {
		const dayNumber = dayNumberFromExpenseDate(expense.expenseDate);
		if (dayNumber === null || dayNumber > totalDays) {
			continue;
		}
		amounts[dayNumber - 1] = (amounts[dayNumber - 1] ?? 0) + expense.amount;
	}

	return amounts.map((amount, index) => {
		const dayNumber = index + 1;
		return {
			date: new Date(year, monthNumber - 1, dayNumber, 12, 0, 0),
			amount,
		};
	});
}

/** Twelve monthly totals for a calendar year (default AreaChart range). */
export function buildYearChartData(
	year: number,
	expenses: FinanceExpense[],
): TransactionsDailyChartPoint[] {
	if (!Number.isFinite(year) || year < 1970) {
		return [];
	}

	const amounts = new Array<number>(12).fill(0);
	const yearPrefix = String(year);

	for (const expense of expenses) {
		if (!expense.expenseDate.startsWith(yearPrefix)) {
			continue;
		}
		const monthNumber = Number(expense.expenseDate.slice(5, 7));
		if (!Number.isFinite(monthNumber) || monthNumber < 1 || monthNumber > 12) {
			continue;
		}
		amounts[monthNumber - 1] = (amounts[monthNumber - 1] ?? 0) + expense.amount;
	}

	return amounts.map((amount, index) => ({
		date: new Date(year, index, 1, 12, 0, 0),
		amount,
	}));
}
