import { describe, expect, test } from "bun:test";
import { calculateMonthlySpendingGoal } from "./monthly-spending-goal.js";

describe("calculateMonthlySpendingGoal", () => {
	test("returns no values when the target is not defined", () => {
		expect(
			calculateMonthlySpendingGoal({
				targetAmount: null,
				spent: 120,
				remainingDays: 10,
			}),
		).toEqual({
			remainingAmount: null,
			dailyLimit: null,
			isOverTarget: false,
		});
	});

	test("calculates the remaining daily allowance including the current day", () => {
		expect(
			calculateMonthlySpendingGoal({
				targetAmount: 1000,
				spent: 250,
				remainingDays: 15,
			}),
		).toEqual({
			remainingAmount: 750,
			dailyLimit: 50,
			isOverTarget: false,
		});
	});

	test("zeros the daily allowance after the target is exceeded", () => {
		expect(
			calculateMonthlySpendingGoal({
				targetAmount: 1000,
				spent: 1200,
				remainingDays: 5,
			}),
		).toEqual({
			remainingAmount: -200,
			dailyLimit: 0,
			isOverTarget: true,
		});
	});

	test("does not divide when the month has ended", () => {
		expect(
			calculateMonthlySpendingGoal({
				targetAmount: 1000,
				spent: 300,
				remainingDays: 0,
			}),
		).toEqual({
			remainingAmount: 700,
			dailyLimit: null,
			isOverTarget: false,
		});
	});
});
