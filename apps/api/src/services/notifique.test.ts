import { describe, expect, it, mock } from "bun:test";
import type { NotifiqueClient } from "./notifique.js";
import { sendPasswordResetEmail } from "./notifique.js";

describe("sendPasswordResetEmail", () => {
	it("sends through the Notifique SDK with an idempotency key", async () => {
		const send = mock(async (params: unknown, options: unknown) => {
			expect(params).toMatchObject({
				to: ["person@example.com"],
				subject: "Reset your Vault password",
			});
			expect(options).toEqual({
				idempotencyKey:
					"vault:password-reset:person@example.com:https://vault.test/reset",
			});
			return {
				success: true,
				data: { status: "QUEUED", count: 1, messageIds: ["email_1"] },
			};
		});
		const client = { email: { send } } as unknown as NotifiqueClient;

		const response = await sendPasswordResetEmail({
			to: "person@example.com",
			url: "https://vault.test/reset",
			from: "noreply@example.com",
			client,
		});

		expect(response.data.messageIds).toEqual(["email_1"]);
		expect(send).toHaveBeenCalledTimes(1);
	});
});
