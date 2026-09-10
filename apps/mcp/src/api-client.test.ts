import { describe, expect, test } from "bun:test";
import { validateMonth } from "./api-client.js";

describe("MCP API client input validation", () => {
	test("accepts valid months", () => {
		expect(() => validateMonth("2026-09")).not.toThrow();
	});

	test("rejects malformed or out-of-range months", () => {
		for (const month of ["2026-9", "2026-00", "2026-13", "09-2026"]) {
			expect(() => validateMonth(month)).toThrow();
		}
	});
});
