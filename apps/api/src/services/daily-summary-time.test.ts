import { describe, expect, test } from "bun:test";
import dayjs from "dayjs";
import { getDueDailySummaryDate } from "./daily-summary-time.js";

describe("daily summary schedule", () => {
	test("waits until 21:00 in São Paulo", () => {
		expect(
			getDueDailySummaryDate(dayjs.utc("2026-09-22T23:59:00Z")),
		).toBeNull();
	});

	test("selects current local date after 21:00", () => {
		expect(getDueDailySummaryDate(dayjs.utc("2026-09-23T01:00:00Z"))).toBe(
			"2026-09-22",
		);
	});
});
