import { and, eq, sql } from "drizzle-orm";
import { createPluggyClient, PluggyApiError } from "../clients/pluggy";
import { db } from "../db";
import {
	expense,
	pluggyAccounts,
	pluggyItems,
	pluggyTransactions,
} from "../db/schema";
import type {
	CreatePluggyConnectTokenInput,
	PluggyAccount,
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

export type PluggySyncResult = {
	total: number;
	synced: number;
	status: "success" | "failed";
	error?: string;
};

export type PluggyAccountSyncResult = {
	total: number;
	synced: number;
	status: "success" | "failed";
	error?: string;
	accountIdsByRemoteId: Map<string, string>;
};

const PLUGGY_EXPENSE_SOURCE = "pluggy";

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

		listAccounts(itemId: string): Promise<PluggyAccount[]> {
			return client.listAccounts(itemId);
		},

		getTransactionsByAccount({
			accountId,
			startDate,
			endDate,
		}: {
			accountId: string;
			startDate: string;
			endDate: string;
		}): Promise<PluggyTransaction[]> {
			return client.getTransactionsByAccount(accountId, startDate, endDate);
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
		startDate: startDate.toISOString().split("T")[0] ?? "",
		endDate: now.toISOString().split("T")[0] ?? "",
	};
}

/** Sync accounts from Pluggy for a given item. */
export async function syncAccountsForItem(params: {
	service: ReturnType<typeof createPluggyService>;
	localItemId: string;
	pluggyItemId: string;
}): Promise<PluggyAccountSyncResult> {
	const { service, localItemId, pluggyItemId } = params;
	const accounts = await service.listAccounts(pluggyItemId);

	const insertable = accounts.map((acc) => ({
		pluggyItemId: localItemId,
		pluggyAccountId: acc.id,
		type: acc.type,
		subtype: acc.subtype ?? null,
		name: acc.name ?? null,
		balance: acc.balance?.toString() ?? null,
		availableBalance: acc.availableBalance?.toString() ?? null,
		currency: acc.currency ?? "BRL",
		transferNumber: acc.transferNumber ?? null,
		brand: acc.brand ?? null,
		status: acc.status ?? null,
	}));

	if (insertable.length === 0) {
		return {
			total: accounts.length,
			synced: 0,
			status: "success" as const,
			accountIdsByRemoteId: new Map(),
		};
	}

	const upserted = await db
		.insert(pluggyAccounts)
		.values(insertable)
		.onConflictDoUpdate({
			target: [pluggyAccounts.pluggyItemId, pluggyAccounts.pluggyAccountId],
			set: {
				type: sql.raw(`EXCLUDED.type`),
				subtype: sql.raw(`EXCLUDED.subtype`),
				name: sql.raw(`EXCLUDED.name`),
				balance: sql.raw(`EXCLUDED.balance`),
				availableBalance: sql.raw(`EXCLUDED.available_balance`),
				currency: sql.raw(`EXCLUDED.currency`),
				transferNumber: sql.raw(`EXCLUDED.transfer_number`),
				brand: sql.raw(`EXCLUDED.brand`),
				status: sql.raw(`EXCLUDED.status`),
				updatedAt: new Date(),
			},
		})
		.returning({
			id: pluggyAccounts.id,
			pluggyAccountId: pluggyAccounts.pluggyAccountId,
		});

	const accountIdsByRemoteId = new Map(
		upserted.map((account) => [account.pluggyAccountId, account.id]),
	);

	return {
		total: accounts.length,
		synced: upserted.length,
		status: "success" as const,
		accountIdsByRemoteId,
	};
}

/** Sync transactions for a single account. */
async function syncTransactionsForAccount(params: {
	service: ReturnType<typeof createPluggyService>;
	userId: string;
	localItemId: string;
	localAccountId: string;
	pluggyAccountId: string;
	startDate: string;
	endDate: string;
}): Promise<PluggySyncResult> {
	const {
		service,
		userId,
		localItemId,
		localAccountId,
		pluggyAccountId,
		startDate,
		endDate,
	} = params;
	const transactions = await service.getTransactionsByAccount({
		accountId: pluggyAccountId,
		startDate,
		endDate,
	});

	const insertable = transactions
		.filter((tx) => Boolean(tx.date))
		.map((tx) => ({
			pluggyItemId: localItemId,
			pluggyAccountId: localAccountId,
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

	const upserted = await db
		.insert(pluggyTransactions)
		.values(insertable)
		.onConflictDoUpdate({
			target: [
				pluggyTransactions.pluggyItemId,
				pluggyTransactions.pluggyTransactionId,
			],
			set: {
				pluggyAccountId: sql.raw(`EXCLUDED.pluggy_account_id`),
				date: sql.raw(`EXCLUDED.date`),
				amount: sql.raw(`EXCLUDED.amount`),
				description: sql.raw(`EXCLUDED.description`),
				category: sql.raw(`EXCLUDED.category`),
			},
		})
		.returning({ id: pluggyTransactions.id });

	await syncExpensesFromPluggyTransactions({
		userId,
		localItemId,
		transactions,
	});

	return {
		total: transactions.length,
		synced: upserted.length,
		status: "success" as const,
	};
}

async function syncExpensesFromPluggyTransactions(params: {
	userId: string;
	localItemId: string;
	transactions: PluggyTransaction[];
}) {
	const { userId, localItemId, transactions } = params;
	const outgoing = transactions
		.filter((tx) => Boolean(tx.date) && tx.amount < 0)
		.map((tx) => ({
			userId,
			expenseDate: tx.date,
			amount: Math.abs(tx.amount).toFixed(2),
			category: tx.category?.trim() || "Outros",
			note: tx.description ?? null,
			source: PLUGGY_EXPENSE_SOURCE,
			sourceExternalId: tx.id,
			sourceItemId: localItemId,
		}));

	if (outgoing.length === 0) {
		return;
	}

	await db
		.insert(expense)
		.values(outgoing)
		.onConflictDoUpdate({
			target: [
				expense.userId,
				expense.source,
				expense.sourceExternalId,
			],
			set: {
				expenseDate: sql.raw(`EXCLUDED.expense_date`),
				amount: sql.raw(`EXCLUDED.amount`),
				category: sql.raw(`EXCLUDED.category`),
				note: sql.raw(`EXCLUDED.note`),
				sourceItemId: sql.raw(`EXCLUDED.source_item_id`),
				updatedAt: new Date(),
			},
		});
}

/** Sync transactions for all accounts of an item. */
export async function syncTransactionsForItem(params: {
	service: ReturnType<typeof createPluggyService>;
	userId: string;
	localItemId: string;
	pluggyItemId: string;
}): Promise<PluggySyncResult> {
	const { service, userId, localItemId, pluggyItemId } = params;
	const { startDate, endDate } = buildInitialSyncWindow();

	// Fetch accounts from Pluggy
	const accounts = await service.listAccounts(pluggyItemId);

	if (accounts.length === 0) {
		return { total: 0, synced: 0, status: "success" };
	}

	const accountSync = await syncAccountsForItem({
		service,
		localItemId,
		pluggyItemId,
	});
	const accountMap = accountSync.accountIdsByRemoteId;

	// Sync transactions per account
	let totalTransactions = 0;
	let syncedTransactions = 0;

	for (const acc of accounts) {
		const localAccountId = accountMap.get(acc.id);
		if (!localAccountId) continue;

		const result = await syncTransactionsForAccount({
			service,
			userId,
			localItemId,
			localAccountId,
			pluggyAccountId: acc.id,
			startDate,
			endDate,
		});

		totalTransactions += result.total;
		syncedTransactions += result.synced;
	}

	return {
		total: totalTransactions,
		synced: syncedTransactions,
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
			userId: params.userId,
			localItemId: item.id,
			pluggyItemId: item.pluggyItemId,
		});

		return { item, sync };
	} catch (error) {
		return {
			item,
			sync: {
				total: 0,
				synced: 0,
				status: "failed" as const,
				error:
					error instanceof PluggyApiError
						? error.message
						: "Falha ao sincronizar transacoes com a Pluggy.",
			},
		};
	}
}

export async function deleteDerivedExpensesForItem(localItemId: string) {
	await db
		.delete(expense)
		.where(
			and(
				eq(expense.source, PLUGGY_EXPENSE_SOURCE),
				eq(expense.sourceItemId, localItemId),
			),
		);
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
};
