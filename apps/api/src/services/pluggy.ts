import { and, eq, sql } from "drizzle-orm";
import { createPluggyClient, PluggyApiError } from "../clients/pluggy/index.js";
import { db } from "../db/index.js";
import {
	expense,
	pluggyAccounts,
	pluggyItems,
	pluggyTransactions,
} from "../db/schema/index.js";
import type {
	CreatePluggyConnectTokenInput,
	PluggyAccount,
	PluggyConnectToken,
	PluggyCredentials,
	PluggyItem as RemotePluggyItem,
	PluggyTransaction,
} from "../clients/pluggy/types.js";

export type {
	CreatePluggyConnectTokenInput,
	PluggyConnectToken,
	RemotePluggyItem as PluggyItem,
	PluggyTransaction,
};

const INITIAL_SYNC_WINDOW_DAYS = 90;
export const PLUGGY_ORPHANED_STATUS = "ITEM_NOT_FOUND";
export const PLUGGY_IGNORED_EXPENSE_CATEGORIES = [
	"Transfer - Internal",
	"Transfers",
	"Transfer - PIX",
	"Credit card payment",
	"Same person transfer",
] as const;

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

function isIgnoredPluggyExpenseCategory(category?: string | null) {
	if (!category) {
		return false;
	}

	return PLUGGY_IGNORED_EXPENSE_CATEGORIES.includes(
		category.trim() as (typeof PLUGGY_IGNORED_EXPENSE_CATEGORIES)[number],
	);
}

function isPluggyItemNotFoundError(error: unknown) {
	if (!(error instanceof PluggyApiError)) {
		return false;
	}

	if (error.statusCode !== 404) {
		return false;
	}

	if (error.message.includes("item not found")) {
		return true;
	}

	try {
		const details = JSON.parse(error.details) as {
			codeDescription?: string;
			message?: string;
		};
		return (
			details.codeDescription === "ITEM_NOT_FOUND" ||
			details.message === "item not found"
		);
	} catch {
		return false;
	}
}

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
	localItemId: string;
	localAccountId: string;
	pluggyAccountId: string;
	startDate: string;
	endDate: string;
}): Promise<PluggySyncResult> {
	const {
		service,
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

	return {
		total: transactions.length,
		synced: upserted.length,
		status: "success" as const,
	};
}

function mapPluggyTransactionsToExpenses(params: {
	userId: string;
	localItemId: string;
	transactions: PluggyTransaction[];
}) {
	const { userId, localItemId, transactions } = params;
	return transactions
		.filter(
			(tx) =>
				Boolean(tx.date) &&
				tx.amount < 0 &&
				!isIgnoredPluggyExpenseCategory(tx.category),
		)
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
}

export async function rebuildExpensesFromStoredTransactions(params: {
	userId: string;
	localItemId: string;
}) {
	const { userId, localItemId } = params;
	const storedTransactions = await db
		.select({
			pluggyTransactionId: pluggyTransactions.pluggyTransactionId,
			date: pluggyTransactions.date,
			amount: pluggyTransactions.amount,
			description: pluggyTransactions.description,
			category: pluggyTransactions.category,
		})
		.from(pluggyTransactions)
		.where(eq(pluggyTransactions.pluggyItemId, localItemId));

	const transactions: PluggyTransaction[] = storedTransactions.map((tx) => ({
		id: tx.pluggyTransactionId,
		date: tx.date,
		amount: Number(tx.amount),
		description: tx.description ?? undefined,
		category: tx.category ?? undefined,
		accountId: "",
	}));
	const outgoing = mapPluggyTransactionsToExpenses({
		userId,
		localItemId,
		transactions,
	});

	await db.transaction(async (tx) => {
		await tx
			.delete(expense)
			.where(
				and(
					eq(expense.userId, userId),
					eq(expense.source, PLUGGY_EXPENSE_SOURCE),
					eq(expense.sourceItemId, localItemId),
				),
			);

		if (outgoing.length === 0) {
			return;
		}

		await tx.insert(expense).values(outgoing);
	});

	return {
		total: transactions.length,
		inserted: outgoing.length,
	};
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
			localItemId,
			localAccountId,
			pluggyAccountId: acc.id,
			startDate,
			endDate,
		});

		totalTransactions += result.total;
		syncedTransactions += result.synced;
	}

	await rebuildExpensesFromStoredTransactions({
		userId,
		localItemId,
	});

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

export async function markPluggyItemAsOrphaned(localItemId: string) {
	await db
		.update(pluggyItems)
		.set({
			status: PLUGGY_ORPHANED_STATUS,
			updatedAt: new Date(),
		})
		.where(eq(pluggyItems.id, localItemId));
}

export function toPluggyUserMessage(error: unknown) {
	if (isPluggyItemNotFoundError(error)) {
		return "A conexao Pluggy nao existe mais para essas chaves. Remova este item e conecte a conta novamente.";
	}

	if (error instanceof PluggyApiError) {
		return error.message;
	}

	return "Falha ao comunicar com a Pluggy.";
}

export function isPluggyItemMissing(error: unknown) {
	return isPluggyItemNotFoundError(error);
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
