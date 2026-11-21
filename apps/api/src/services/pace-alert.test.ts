import { describe, expect, test } from "bun:test";
import dayjs from "dayjs";
import {
	buildPaceAlertMessage,
	isQuietHours,
	paceClock,
	pendingCategoryAlerts,
	projectMonthEndSpend,
	shouldAlertPace,
} from "./pace-alert.js";

const status = (category: string, percentUsed: number) => ({
	category,
	targetAmount: 100,
	spent: percentUsed,
	remaining: 100 - percentUsed,
	percentUsed,
	isOver: percentUsed > 100,
});

describe("projectMonthEndSpend", () => {
	test("projects linearly: R$ 600 on day 10 of 30 is R$ 1.800", () => {
		expect(projectMonthEndSpend({ spent: 600, daysElapsed: 10, daysInMonth: 30 })).toBe(1800);
	});
	test("is safe with no elapsed days, negative or invalid spend", () => {
		expect(projectMonthEndSpend({ spent: 50, daysElapsed: 0, daysInMonth: 30 })).toBe(50);
		expect(projectMonthEndSpend({ spent: -5, daysElapsed: 10, daysInMonth: 30 })).toBe(0);
		expect(projectMonthEndSpend({ spent: Number.NaN, daysElapsed: 10, daysInMonth: 30 })).toBe(0);
	});
	test("on the last day it equals what was spent", () => {
		expect(projectMonthEndSpend({ spent: 999.99, daysElapsed: 30, daysInMonth: 30 })).toBe(999.99);
	});
});

describe("shouldAlertPace", () => {
	test("never before the 5th day", () => {
		expect(shouldAlertPace({ projected: 9999, target: 100, daysElapsed: 4 })).toBe(false);
		expect(shouldAlertPace({ projected: 9999, target: 100, daysElapsed: 5 })).toBe(true);
	});
	test("only when the projection is above the ceiling", () => {
		expect(shouldAlertPace({ projected: 1000, target: 1000, daysElapsed: 10 })).toBe(false);
		expect(shouldAlertPace({ projected: 1000.01, target: 1000, daysElapsed: 10 })).toBe(true);
		expect(shouldAlertPace({ projected: 500, target: 1000, daysElapsed: 10 })).toBe(false);
	});
	test("no ceiling, no alert", () => {
		expect(shouldAlertPace({ projected: 5000, target: null, daysElapsed: 10 })).toBe(false);
		expect(shouldAlertPace({ projected: 5000, target: 0, daysElapsed: 10 })).toBe(false);
	});
});

describe("quiet hours and Brasília calendar", () => {
	test("22:00 to 07:59 in Brasília is quiet, across midnight", () => {
		// Brasília is UTC-3.
		expect(isQuietHours(dayjs("2026-03-10T00:59:00Z"))).toBe(false); // 21:59
		expect(isQuietHours(dayjs("2026-03-10T01:00:00Z"))).toBe(true); // 22:00
		expect(isQuietHours(dayjs("2026-03-10T05:00:00Z"))).toBe(true); // 02:00
		expect(isQuietHours(dayjs("2026-03-10T10:59:00Z"))).toBe(true); // 07:59
		expect(isQuietHours(dayjs("2026-03-10T11:00:00Z"))).toBe(false); // 08:00
	});
	test("the day and month follow Brasília, not UTC", () => {
		// 02:00 UTC on 1 April is still 31 March in Brasília.
		const clock = paceClock(dayjs("2026-04-01T02:00:00Z"));
		expect(clock).toMatchObject({ today: "2026-03-31", month: "2026-03", daysElapsed: 31, daysInMonth: 31 });
		expect(paceClock(dayjs("2026-02-10T15:00:00Z"))).toMatchObject({ daysElapsed: 10, daysInMonth: 28 });
	});
});

describe("pendingCategoryAlerts", () => {
	test("crossing 80% alerts once; crossing 100% alerts again", () => {
		const at85 = pendingCategoryAlerts({ limits: [status("Mercado", 85)], sent: new Set() });
		expect(at85).toMatchObject([{ categoryKey: "mercado", threshold: 80, mark: [80] }]);

		const sent80 = new Set(["mercado:80"]);
		expect(pendingCategoryAlerts({ limits: [status("Mercado", 90)], sent: sent80 })).toEqual([]);
		const at105 = pendingCategoryAlerts({ limits: [status("Mercado", 105)], sent: sent80 });
		expect(at105).toMatchObject([{ threshold: 100, mark: [100] }]);

		expect(
			pendingCategoryAlerts({ limits: [status("Mercado", 130)], sent: new Set(["mercado:80", "mercado:100"]) }),
		).toEqual([]);
	});
	test("jumping straight past 100% sends one alert and records both thresholds", () => {
		const [alert] = pendingCategoryAlerts({ limits: [status("Lazer", 120)], sent: new Set() });
		expect(alert).toMatchObject({ threshold: 100, mark: [80, 100] });
	});
	test("below 80% nothing; keys ignore case and accents", () => {
		expect(pendingCategoryAlerts({ limits: [status("Mercado", 79.99)], sent: new Set() })).toEqual([]);
		const [alert] = pendingCategoryAlerts({ limits: [status("Alimentação", 80)], sent: new Set(["alimentacao:80"]) });
		expect(alert).toBeUndefined();
	});
});

describe("buildPaceAlertMessage", () => {
	test("states the projection and how much it passes the ceiling", () => {
		const { title, body } = buildPaceAlertMessage({
			pace: { projected: 1800, target: 1000 },
			categories: [],
		});
		expect(title).toContain("ritmo");
		const text = body.replace(/\s/g, " ");
		expect(text).toContain("R$ 1.800,00");
		expect(text).toContain("R$ 800,00 acima do teto de R$ 1.000,00");
	});
	test("folds category alerts into the same push", () => {
		const cats = pendingCategoryAlerts({
			limits: [status("Mercado", 85), status("Lazer", 110)],
			sent: new Set(),
		});
		const { body } = buildPaceAlertMessage({ pace: null, categories: cats });
		expect(body).toContain("Mercado chegou a 80% do limite do mês.");
		expect(body).toContain("Lazer passou do limite do mês.");
	});
});
