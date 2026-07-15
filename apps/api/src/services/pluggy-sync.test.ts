import { describe, expect, test } from "bun:test";
import { summarizeSyncResult } from "./pluggy.js";

describe("summarizeSyncResult", () => {
	test("returns partial_failure when later phases fail after partial progress", () => {
		const result = summarizeSyncResult({
			accounts: {
				total: 2,
				synced: 2,
				status: "success",
			},
			bills: {
				total: 1,
				synced: 1,
				status: "success",
			},
			transactions: {
				total: 12,
				synced: 8,
				status: "failed",
				error: "Invalid cursor",
			},
		});

		expect(result.status).toBe("partial_failure");
		expect(result.error).toBe("Invalid cursor");
		expect(result.total).toBe(15);
		expect(result.synced).toBe(11);
	});

	test("returns failed when accounts fail and downstream phases are skipped", () => {
		const result = summarizeSyncResult({
			accounts: {
				total: 0,
				synced: 0,
				status: "failed",
				error: "401",
			},
			bills: {
				total: 0,
				synced: 0,
				status: "skipped",
				error: "bills skipped",
			},
			transactions: {
				total: 0,
				synced: 0,
				status: "skipped",
				error: "transactions skipped",
			},
		});

		expect(result.status).toBe("failed");
		expect(result.error).toBe("401");
	});

	test("keeps overall success when a phase is skipped but none failed", () => {
		const result = summarizeSyncResult({
			accounts: {
				total: 1,
				synced: 1,
				status: "success",
			},
			bills: {
				total: 0,
				synced: 0,
				status: "skipped",
				error: "no credit accounts",
			},
			transactions: {
				total: 4,
				synced: 4,
				status: "success",
			},
		});

		expect(result.status).toBe("success");
		expect(result.total).toBe(5);
		expect(result.synced).toBe(5);
	});
});
