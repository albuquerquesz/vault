import { createPluggyClient } from "../clients/pluggy";
import type {
	CreatePluggyConnectTokenInput,
	PluggyConnectToken,
	PluggyCredentials,
	PluggyTransaction,
} from "../clients/pluggy/types";

export type {
	CreatePluggyConnectTokenInput,
	PluggyConnectToken,
	PluggyTransaction,
};

/** Pluggy operations bound to the given BYOK (or platform) credentials. */
export function createPluggyService(creds: PluggyCredentials) {
	const client = createPluggyClient(creds);

	return {
		createConnectToken(
			input: CreatePluggyConnectTokenInput = {},
		): Promise<PluggyConnectToken> {
			return client.createConnectToken(input);
		},

		deleteItem(itemId: string) {
			return client.deleteItem(itemId);
		},

		getTransactions({
			itemId,
			startDate,
			endDate,
		}: {
			itemId: string;
			startDate: string;
			endDate: string;
		}): Promise<PluggyTransaction[]> {
			return client.getTransactions(itemId, startDate, endDate);
		},

		registerWebhook(url: string) {
			return client.registerWebhook(url);
		},

		deleteWebhook(webhookId: string) {
			return client.deleteWebhook(webhookId);
		},
	};
}

/** @deprecated Prefer createPluggyService(creds) for BYOK. Kept for call-site migration. */
export const pluggyService = {
	async createConnectToken(
		_input: CreatePluggyConnectTokenInput = {},
	): Promise<PluggyConnectToken> {
		throw new Error(
			"pluggyService requires per-user credentials — use createPluggyService(creds)",
		);
	},
	async deleteItem(_itemId: string) {
		throw new Error(
			"pluggyService requires per-user credentials — use createPluggyService(creds)",
		);
	},
	async getTransactions(_args: {
		itemId: string;
		startDate: string;
		endDate: string;
	}): Promise<PluggyTransaction[]> {
		throw new Error(
			"pluggyService requires per-user credentials — use createPluggyService(creds)",
		);
	},
};
