import { createPluggyClient } from "../clients/pluggy";
import { db } from "../db";
import { pluggyItems, pluggyTransactions } from "../db/schema";
import type {
	CreatePluggyConnectTokenInput,
	PluggyConnectToken,
	PluggyCredentials,
	PluggyItem as RemotePluggyItem,
	PluggyTransaction,
} from "../clients/pluggy/types";

export type {
	CreatePluggyConnectTokenInput,
	PluggyConnectToken,
	RemotePluggyItem as PluggyItem,
	PluggyTransaction,
};

const INITIAL_SYNC_WINDOW_DAYS = 90;

/** Pluggy operations bound to the given user BYOK credentials. */
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

		getItem(itemId: string): Promise<RemotePluggyItem> {
			return client.getItem(itemId);
		},

		listConnectors() {
			return client.listConnectors();
		},

		registerWebhook(url: string) {
			return client.registerWebhook(url);
		},

		deleteWebhook(webhookId: string) {
			return client.deleteWebhook(webhookId);
		},
	};
}

async function resolveProviderName(
	service: ReturnType<typeof createPluggyService>,
	item: RemotePluggyItem,
): Promise<string> {
	if (item.connector?.name?.trim()) {
		return item.connector.name.trim();
	}

	const connectorId = item.connector?.id ?? item.connectorId;
	if (connectorId === undefined) {
		return "Unknown institution";
	}

	const connectors = await service.listConnectors();
	const connector = connectors.find((entry) => Number(entry.id) === connectorId);
	return connector?.name ?? "Unknown institution";
}

function buildInitialSyncWindow() {
	const now = new Date();
	const startDate = new Date(
		now.getTime() - INITIAL_SYNC_WINDOW_DAYS * 24 * 60 * 60 * 1000,
	);

	return {
		startDate: startDate.toISOString().split("T")[0]!,
		endDate: now.toISOString().split("T")[0]!,
	};
}

export async function syncTransactionsForItem(params: {
	service: ReturnType<typeof createPluggyService>;
	localItemId: string;
	pluggyItemId: string;
}) {
	const { service, localItemId, pluggyItemId } = params;
	const { startDate, endDate } = buildInitialSyncWindow();
	const transactions = await service.getTransactions({
		itemId: pluggyItemId,
		startDate,
		endDate,
	});

	const insertable = transactions
		.filter((tx) => Boolean(tx.date))
		.map((tx) => ({
			pluggyItemId: localItemId,
			pluggyTransactionId: tx.id,
			date: tx.date,
			amount: tx.amount.toString(),
			description: tx.description ?? null,
			category: tx.category ?? null,
		}));

	if (insertable.length === 0) {
		return {
			total: transactions.length,
			synced: 0,
			status: "success" as const,
		};
	}

	const inserted = await db
		.insert(pluggyTransactions)
		.values(insertable)
		.onConflictDoNothing({
			target: [
				pluggyTransactions.pluggyItemId,
				pluggyTransactions.pluggyTransactionId,
			],
		})
		.returning({ id: pluggyTransactions.id });

	return {
		total: transactions.length,
		synced: inserted.length,
		status: "success" as const,
	};
}

export async function persistPluggyItemAndSync(params: {
	userId: string;
	pluggyItemId: string;
	creds: PluggyCredentials;
}) {
	const service = createPluggyService(params.creds);
	const remoteItem = await service.getItem(params.pluggyItemId);
	const provider = await resolveProviderName(service, remoteItem);

	const [item] = await db
		.insert(pluggyItems)
		.values({
			userId: params.userId,
			pluggyItemId: remoteItem.id,
			provider,
			status: remoteItem.status,
		})
		.onConflictDoUpdate({
			target: [pluggyItems.userId, pluggyItems.pluggyItemId],
			set: {
				provider,
				status: remoteItem.status,
				updatedAt: new Date(),
			},
		})
		.returning();

	if (!item) {
		throw new Error("Failed to persist Pluggy item");
	}

	try {
		const sync = await syncTransactionsForItem({
			service,
			localItemId: item.id,
			pluggyItemId: item.pluggyItemId,
		});

		return { item, sync };
	} catch {
		return {
			item,
			sync: {
				total: 0,
				synced: 0,
				status: "failed" as const,
			},
		};
	}
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
