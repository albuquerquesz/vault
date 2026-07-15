import { describe, expect, test } from "bun:test";
import { parsePluggyWebhookBody } from "./pluggy-webhooks.js";

describe("parsePluggyWebhookBody", () => {
	test("accepts item/updated payload", () => {
		const payload = parsePluggyWebhookBody({
			event: "item/updated",
			eventId: "evt-1",
			itemId: "item-1",
			clientUserId: "user-1",
			triggeredBy: "SYNC",
		});

		expect(payload.event).toBe("item/updated");
		expect(payload.itemId).toBe("item-1");
		expect(payload.clientUserId).toBe("user-1");
	});

	test("accepts transactions/created payload", () => {
		const payload = parsePluggyWebhookBody({
			event: "transactions/created",
			eventId: "evt-2",
			itemId: "item-1",
			accountId: "acc-1",
			createdTransactionsLink:
				"https://api.pluggy.ai/transactions?accountId=acc-1",
		});

		expect(payload.event).toBe("transactions/created");
		expect(payload.accountId).toBe("acc-1");
	});

	test("rejects missing event", () => {
		expect(() =>
			parsePluggyWebhookBody({
				itemId: "item-1",
			}),
		).toThrow();
	});
});
