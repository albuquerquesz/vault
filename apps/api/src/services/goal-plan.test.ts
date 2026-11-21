import { describe, expect, test } from "bun:test";
import { applyContribution, planGoal } from "./goal-plan.js";

describe("planGoal", () => {
	test("spreads what is missing over the months left, deadline month included", () => {
		const plan = planGoal({
			targetAmount: 2000,
			currentAmount: 800,
			targetDate: "2027-04-30",
			today: "2026-11-20",
		});
		// Nov, Dec, Jan, Feb, Mar, Apr = 6 months; R$ 1.200 / 6.
		expect(plan).toMatchObject({
			remaining: 1200,
			monthsLeft: 6,
			perMonth: 200,
			isPastDue: false,
			isComplete: false,
		});
	});

	test("rounds the monthly amount up to the cent", () => {
		const plan = planGoal({
			targetAmount: 100,
			currentAmount: 0,
			targetDate: "2027-01-31",
			today: "2026-11-20",
		});
		expect(plan.monthsLeft).toBe(3);
		expect(plan.perMonth).toBe(33.34);
	});

	test("a deadline in the current month asks for everything now", () => {
		const plan = planGoal({
			targetAmount: 500,
			currentAmount: 100,
			targetDate: "2026-11-30",
			today: "2026-11-20",
		});
		expect(plan).toMatchObject({ monthsLeft: 1, perMonth: 400, isPastDue: false });
	});

	test("past the deadline it is flagged and the whole remainder is due", () => {
		const plan = planGoal({
			targetAmount: 500,
			currentAmount: 100,
			targetDate: "2026-09-30",
			today: "2026-11-20",
		});
		expect(plan).toMatchObject({ monthsLeft: 0, perMonth: 400, isPastDue: true });
	});

	test("a goal without a deadline has no monthly amount", () => {
		const plan = planGoal({
			targetAmount: 500,
			currentAmount: 100,
			targetDate: null,
			today: "2026-11-20",
		});
		expect(plan).toMatchObject({ remaining: 400, monthsLeft: null, perMonth: null });
	});

	test("a goal already reached owes nothing", () => {
		const plan = planGoal({
			targetAmount: 500,
			currentAmount: 520,
			targetDate: "2026-09-30",
			today: "2026-11-20",
		});
		expect(plan).toMatchObject({ isComplete: true, perMonth: 0, isPastDue: false });
	});
});

describe("applyContribution", () => {
	test("a deposit adds, a withdrawal subtracts, undo reverses exactly", () => {
		const deposited = applyContribution({ currentAmount: 100, amount: 25.5, kind: "deposit" });
		expect(deposited).toBe(125.5);
		expect(
			applyContribution({ currentAmount: deposited, amount: 25.5, kind: "deposit", undo: true }),
		).toBe(100);
		const withdrawn = applyContribution({ currentAmount: 100, amount: 40, kind: "withdrawal" });
		expect(withdrawn).toBe(60);
		expect(
			applyContribution({ currentAmount: withdrawn, amount: 40, kind: "withdrawal", undo: true }),
		).toBe(100);
	});
});
