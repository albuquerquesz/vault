import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { createPluggyClient, PluggyApiError } from "../clients/pluggy/index.js";
import type {
	CreatePluggyConnectTokenInput,
	PluggyAccount,
	PluggyBill,
	PluggyConnectToken,
	PluggyCredentials,
	PluggyTransaction,
	PluggyTransactionsFetchResult,
	RegisterPluggyWebhookInput,
	PluggyItem as RemotePluggyItem,
} from "../clients/pluggy/types.js";
import { db } from "../db/index.js";
import {
	expense,
	monthlyBill,
	monthlyBillItem,
	pluggyAccounts,
	pluggyBills,
	pluggyItems,
	pluggyTransactions,
} from "../db/schema/index.js";

export type {
	CreatePluggyConnectTokenInput,
	PluggyConnectToken,
	PluggyTransaction,
	RegisterPluggyWebhookInput,
	RemotePluggyItem as PluggyItem,
};

const INITIAL_SYNC_WINDOW_MONTHS = 6;
export const PLUGGY_ORPHANED_STATUS = "ITEM_NOT_FOUND";
export const PLUGGY_IGNORED_EXPENSE_CATEGORIES = [
	"Transfer - Internal",
	"Transfers",
	"Transfer - PIX",
	"Credit card payment",
	"Same person transfer",
] as const;

export type PluggySyncStatus = "success" | "partial_failure" | "failed";
export type PluggySyncPhaseStatus = "success" | "failed" | "skipped";

export type PluggySyncAccountResult = {
	pluggyAccountId: string;
	localAccountId?: string;
	total: number;
	synced: number;
	status: PluggySyncPhaseStatus;
	error?: string;
};

export type PluggySyncPhaseResult = {
	total: number;
	synced: number;
	status: PluggySyncPhaseStatus;
	error?: string;
	accountResults?: PluggySyncAccountResult[];
};

export type PluggySyncResult = {
	total: number;
	synced: number;
	status: PluggySyncStatus;
	error?: string;
	accounts: PluggySyncPhaseResult;
	bills: PluggySyncPhaseResult;
	transactions: PluggySyncPhaseResult;
};

export type PluggyAccountSyncResult = PluggySyncPhaseResult & {
	accountIdsByRemoteId: Map<string, string>;
	accounts: PluggyAccount[];
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

function skippedPhase(error: string): PluggySyncPhaseResult {
	return {
		total: 0,
		synced: 0,
		status: "skipped",
		error,
	};
}

function failedPhase(error: string): PluggySyncPhaseResult {
	return {
		total: 0,
		synced: 0,
		status: "failed",
		error,
	};
}

function toPhaseErrorMessage(error: unknown, fallback: string) {
	if (error instanceof PluggyApiError) {
		return error.message;
	}

	if (error instanceof Error && error.message) {
		return error.message;
	}

	return fallback;
}

export function summarizeSyncResult(phases: {
	accounts: PluggySyncPhaseResult;
	bills: PluggySyncPhaseResult;
	transactions: PluggySyncPhaseResult;
}): PluggySyncResult {
	const orderedPhases = [phases.accounts, phases.bills, phases.transactions];
	const firstFailedPhase = orderedPhases.find((phase) => phase.status === "failed");
	const hasFailure = Boolean(firstFailedPhase);
	const hasSuccessfulPhase = orderedPhases.some(
		(phase) => phase.status === "success",
	);

	return {
		total: orderedPhases.reduce((sum, phase) => sum + phase.total, 0),
		synced: orderedPhases.reduce((sum, phase) => sum + phase.synced, 0),
		status: hasFailure
			? hasSuccessfulPhase
				? "partial_failure"
				: "failed"
			: "success",
		error: firstFailedPhase?.error,
		...phases,
	};
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

		listBills(accountId: string): Promise<PluggyBill[]> {
			return client.listBills(accountId);
		},

		getTransactionsByAccount({
			accountId,
			startDate,
			endDate,
		}: {
			accountId: string;
			startDate: string;
			endDate: string;
		}): Promise<PluggyTransactionsFetchResult> {
			return client.getTransactionsByAccount(accountId, startDate, endDate);
		},

		getItem(itemId: string): Promise<RemotePluggyItem> {
			return client.getItem(itemId);
		},

		listConnectors() {
			return client.listConnectors();
		},

		registerWebhook(input: RegisterPluggyWebhookInput) {
			return client.registerWebhook(input);
		},

		listWebhooks() {
			return client.listWebhooks();
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
	const connector = connectors.find(
		(entry) => Number(entry.id) === connectorId,
	);
	return connector?.name ?? "Unknown institution";
}

function buildInitialSyncWindow() {
	const now = new Date();
	const startDate = new Date(
		now.getFullYear(),
		now.getMonth() - (INITIAL_SYNC_WINDOW_MONTHS - 1),
		1,
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
			status: "success",
			accountIdsByRemoteId: new Map(),
			accounts,
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
		status: "success",
		accountIdsByRemoteId,
		accounts,
	};
}

function sumBillPayments(bill: PluggyBill): number {
	return (bill.payments ?? []).reduce(
		(sum, payment) => sum + (Number(payment.amount) || 0),
		0,
	);
}

function monthFromDueDate(dueDate: string | Date): string | null {
	const raw = typeof dueDate === "string" ? dueDate : dueDate.toISOString();
	const match = raw.match(/^(\d{4}-\d{2})/);
	return match?.[1] ?? null;
}

/** Sync credit-card bills for CREDIT accounts of an item. */
export async function syncBillsForCreditAccounts(params: {
	service: ReturnType<typeof createPluggyService>;
	userId: string;
	accounts: PluggyAccount[];
	accountIdsByRemoteId: Map<string, string>;
}): Promise<PluggySyncPhaseResult> {
	const { service, userId, accounts, accountIdsByRemoteId } = params;
	const creditAccounts = accounts.filter(
		(account) => account.type === "CREDIT",
	);

	if (creditAccounts.length === 0) {
		await materializeMonthlyBillsFromPluggy({ userId });
		return {
			total: 0,
			synced: 0,
			status: "skipped",
			error: "Nenhuma conta de credito encontrada para sincronizar faturas.",
		};
	}

	let total = 0;
	let synced = 0;
	const accountResults: PluggySyncAccountResult[] = [];

	for (const account of creditAccounts) {
		const localAccountId = accountIdsByRemoteId.get(account.id);
		if (!localAccountId) {
			accountResults.push({
				pluggyAccountId: account.id,
				total: 0,
				synced: 0,
				status: "failed",
				error: "Conta local nao encontrada para materializar faturas.",
			});
			continue;
		}

		try {
			const bills = await service.listBills(account.id);
			total += bills.length;

			const insertable = bills
				.filter((bill) => Boolean(bill.id) && Boolean(bill.dueDate))
				.map((bill) => {
					const paidAmount = sumBillPayments(bill);
					return {
						pluggyAccountId: localAccountId,
						pluggyBillId: bill.id,
						dueDate: new Date(bill.dueDate),
						totalAmount: bill.totalAmount.toString(),
						paidAmount: paidAmount.toString(),
						minimumPaymentAmount:
							bill.minimumPaymentAmount != null
								? bill.minimumPaymentAmount.toString()
								: null,
						currency: bill.totalAmountCurrencyCode ?? "BRL",
					};
				});

			if (insertable.length === 0) {
				accountResults.push({
					pluggyAccountId: account.id,
					localAccountId,
					total: bills.length,
					synced: 0,
					status: "success",
				});
				continue;
			}

			const upserted = await db
				.insert(pluggyBills)
				.values(insertable)
				.onConflictDoUpdate({
					target: [pluggyBills.pluggyAccountId, pluggyBills.pluggyBillId],
					set: {
						dueDate: sql.raw(`EXCLUDED.due_date`),
						totalAmount: sql.raw(`EXCLUDED.total_amount`),
						paidAmount: sql.raw(`EXCLUDED.paid_amount`),
						minimumPaymentAmount: sql.raw(`EXCLUDED.minimum_payment_amount`),
						currency: sql.raw(`EXCLUDED.currency`),
						updatedAt: new Date(),
					},
				})
				.returning({ id: pluggyBills.id });

			synced += upserted.length;
			accountResults.push({
				pluggyAccountId: account.id,
				localAccountId,
				total: bills.length,
				synced: upserted.length,
				status: "success",
			});
		} catch (error) {
			if (isPluggyItemNotFoundError(error)) {
				throw error;
			}

			const message = toPhaseErrorMessage(
				error,
				"Falha ao sincronizar faturas da conta.",
			);
			console.warn("[pluggy] bill sync failed for account", {
				userId,
				pluggyAccountId: account.id,
				localAccountId,
				error: message,
			});
			accountResults.push({
				pluggyAccountId: account.id,
				localAccountId,
				total: 0,
				synced: 0,
				status: "failed",
				error: message,
			});
		}
	}

	await materializeMonthlyBillsFromPluggy({ userId });

	const failedAccounts = accountResults.filter(
		(account) => account.status === "failed",
	);

	return {
		total,
		synced,
		status: failedAccounts.length > 0 ? "failed" : "success",
		error:
			failedAccounts.length > 0
				? failedAccounts
						.map((account) => account.error)
						.filter(Boolean)
						.join(" | ")
				: undefined,
		accountResults: accountResults,
	};
}

/**
 * Rebuild monthly_bill / monthly_bill_item read model from stored Pluggy bills.
 * Pluggy-sourced items are replaced; manual items are preserved.
 */
export async function materializeMonthlyBillsFromPluggy(params: {
	userId: string;
}): Promise<void> {
	const { userId } = params;

	const rows = await db
		.select({
			pluggyBillId: pluggyBills.pluggyBillId,
			dueDate: pluggyBills.dueDate,
			totalAmount: pluggyBills.totalAmount,
			paidAmount: pluggyBills.paidAmount,
			accountName: pluggyAccounts.name,
			accountRemoteId: pluggyAccounts.pluggyAccountId,
		})
		.from(pluggyBills)
		.innerJoin(
			pluggyAccounts,
			eq(pluggyBills.pluggyAccountId, pluggyAccounts.id),
		)
		.innerJoin(pluggyItems, eq(pluggyAccounts.pluggyItemId, pluggyItems.id))
		.where(eq(pluggyItems.userId, userId))
		.orderBy(asc(pluggyBills.dueDate));

	const existingMonthsWithPluggyItems = await db
		.select({ month: monthlyBill.month })
		.from(monthlyBill)
		.innerJoin(
			monthlyBillItem,
			eq(monthlyBillItem.monthlyBillId, monthlyBill.id),
		)
		.where(
			and(
				eq(monthlyBill.userId, userId),
				eq(monthlyBillItem.source, "pluggy"),
			),
		);

	// account+month → latest bill by dueDate
	const byMonthAccount = new Map<
		string,
		{
			month: string;
			name: string;
			paidAmount: number;
			totalAmount: number;
			pluggyBillId: string;
			dueDateMs: number;
		}
	>();

	for (const row of rows) {
		const month = monthFromDueDate(row.dueDate);
		if (!month) continue;

		const name =
			row.accountName?.trim() || row.accountRemoteId.slice(0, 8) || "Cartão";
		const key = `${month}::${row.accountRemoteId}`;
		const dueDateMs = new Date(row.dueDate).getTime();
		const existing = byMonthAccount.get(key);
		if (existing && existing.dueDateMs >= dueDateMs) {
			continue;
		}

		byMonthAccount.set(key, {
			month,
			name,
			paidAmount: Number(row.paidAmount) || 0,
			totalAmount: Number(row.totalAmount) || 0,
			pluggyBillId: row.pluggyBillId,
			dueDateMs,
		});
	}

	const months = [
		...new Set([
			...byMonthAccount.values().map((value) => value.month),
			...existingMonthsWithPluggyItems.map((row) => row.month),
		]),
	].sort();

	for (const month of months) {
		const monthItems = [...byMonthAccount.values()]
			.filter((item) => item.month === month)
			.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

		const [bill] = await db
			.insert(monthlyBill)
			.values({
				userId,
				month,
				totalBill: "0",
			})
			.onConflictDoUpdate({
				target: [monthlyBill.userId, monthlyBill.month],
				set: {
					updatedAt: new Date(),
				},
			})
			.returning();

		if (!bill) continue;

		await db
			.delete(monthlyBillItem)
			.where(
				and(
					eq(monthlyBillItem.monthlyBillId, bill.id),
					eq(monthlyBillItem.source, "pluggy"),
				),
			);

		const manualItems = await db
			.select()
			.from(monthlyBillItem)
			.where(eq(monthlyBillItem.monthlyBillId, bill.id))
			.orderBy(asc(monthlyBillItem.sortOrder));

		const startSort =
			manualItems.reduce((max, item) => Math.max(max, item.sortOrder), 0) + 1;

		if (monthItems.length > 0) {
			await db.insert(monthlyBillItem).values(
				monthItems.map((item, index) => ({
					monthlyBillId: bill.id,
					name: item.name,
					paidAmount: item.paidAmount.toFixed(2),
					totalAmount: item.totalAmount.toFixed(2),
					sortOrder: startSort + index,
					source: "pluggy",
					pluggyBillId: item.pluggyBillId,
				})),
			);
		}

		const allItems = await db
			.select()
			.from(monthlyBillItem)
			.where(eq(monthlyBillItem.monthlyBillId, bill.id));

		const totalBill = allItems.reduce(
			(sum, item) => sum + (Number(item.totalAmount) || 0),
			0,
		);

		await db
			.update(monthlyBill)
			.set({
				totalBill: totalBill.toFixed(2),
				updatedAt: new Date(),
			})
			.where(eq(monthlyBill.id, bill.id));
	}
}

/** Sync transactions for a single account. */
async function syncTransactionsForAccount(params: {
	service: ReturnType<typeof createPluggyService>;
	localItemId: string;
	localAccountId: string;
	pluggyAccountId: string;
	startDate: string;
	endDate: string;
}): Promise<PluggySyncAccountResult> {
	const {
		service,
		localItemId,
		localAccountId,
		pluggyAccountId,
		startDate,
		endDate,
	} = params;
	const { transactions, error } = await service.getTransactionsByAccount({
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
			pluggyAccountId,
			localAccountId,
			total: transactions.length,
			synced: 0,
			status: error ? "failed" : "success",
			error,
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
		pluggyAccountId,
		localAccountId,
		total: transactions.length,
		synced: upserted.length,
		status: error ? "failed" : "success",
		error,
	};
}

export type StoredTransactionForExpense = {
	pluggyTransactionId: string;
	date: string;
	amount: string | number;
	description: string | null;
	category: string | null;
	provider: string | null;
	accountName: string | null;
	accountType: string | null;
	accountSubtype: string | null;
	accountBrand: string | null;
};

/** Maps stored Pluggy transactions into expense rows with origin metadata. */
export function mapPluggyTransactionsToExpenses(params: {
	userId: string;
	localItemId: string;
	transactions: StoredTransactionForExpense[];
}) {
	const { userId, localItemId, transactions } = params;
	return transactions
		.filter((tx) => {
			const amount = Number(tx.amount);
			return (
				Boolean(tx.date) &&
				Number.isFinite(amount) &&
				amount < 0 &&
				!isIgnoredPluggyExpenseCategory(tx.category)
			);
		})
		.map((tx) => ({
			userId,
			expenseDate: tx.date,
			amount: Math.abs(Number(tx.amount)).toFixed(2),
			category: tx.category?.trim() || "Outros",
			note: tx.description ?? null,
			source: PLUGGY_EXPENSE_SOURCE,
			sourceExternalId: tx.pluggyTransactionId,
			sourceItemId: localItemId,
			sourceProvider: tx.provider,
			sourceAccountName: tx.accountName,
			sourceAccountType: tx.accountType,
			sourceAccountSubtype: tx.accountSubtype,
			sourceAccountBrand: tx.accountBrand,
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
			provider: pluggyItems.provider,
			accountName: pluggyAccounts.name,
			accountType: pluggyAccounts.type,
			accountSubtype: pluggyAccounts.subtype,
			accountBrand: pluggyAccounts.brand,
		})
		.from(pluggyTransactions)
		.innerJoin(pluggyItems, eq(pluggyTransactions.pluggyItemId, pluggyItems.id))
		.leftJoin(
			pluggyAccounts,
			eq(pluggyTransactions.pluggyAccountId, pluggyAccounts.id),
		)
		.where(
			and(
				eq(pluggyTransactions.pluggyItemId, localItemId),
				isNull(pluggyTransactions.hiddenAt),
			),
		);

	const outgoing = mapPluggyTransactionsToExpenses({
		userId,
		localItemId,
		transactions: storedTransactions,
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
		total: storedTransactions.length,
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

	let accountsPhase: PluggyAccountSyncResult;

	try {
		accountsPhase = await syncAccountsForItem({
			service,
			localItemId,
			pluggyItemId,
		});
	} catch (error) {
		if (isPluggyItemNotFoundError(error)) {
			throw error;
		}

		return summarizeSyncResult({
			accounts: failedPhase(
				toPhaseErrorMessage(error, "Falha ao sincronizar contas da Pluggy."),
			),
			bills: skippedPhase(
				"Faturas nao sincronizadas porque a etapa de contas falhou.",
			),
			transactions: skippedPhase(
				"Transacoes nao sincronizadas porque a etapa de contas falhou.",
			),
		});
	}

	const accounts = accountsPhase.accounts;
	if (accounts.length === 0) {
		return summarizeSyncResult({
			accounts: accountsPhase,
			bills: skippedPhase(
				"Nenhuma conta retornada pela Pluggy para sincronizar faturas.",
			),
			transactions: skippedPhase(
				"Nenhuma conta retornada pela Pluggy para sincronizar transacoes.",
			),
		});
	}

	let billsPhase: PluggySyncPhaseResult;
	try {
		billsPhase = await syncBillsForCreditAccounts({
			service,
			userId,
			accounts,
			accountIdsByRemoteId: accountsPhase.accountIdsByRemoteId,
		});
	} catch (error) {
		if (isPluggyItemNotFoundError(error)) {
			throw error;
		}

		billsPhase = failedPhase(
			toPhaseErrorMessage(error, "Falha ao sincronizar faturas da Pluggy."),
		);
	}

	let transactionsPhase: PluggySyncPhaseResult;
	try {
		let totalTransactions = 0;
		let syncedTransactions = 0;
		const accountResults: PluggySyncAccountResult[] = [];

		for (const account of accounts) {
			const localAccountId = accountsPhase.accountIdsByRemoteId.get(account.id);
			if (!localAccountId) {
				accountResults.push({
					pluggyAccountId: account.id,
					total: 0,
					synced: 0,
					status: "failed",
					error: "Conta local nao encontrada para sincronizar transacoes.",
				});
				continue;
			}

			const result = await syncTransactionsForAccount({
				service,
				localItemId,
				localAccountId,
				pluggyAccountId: account.id,
				startDate,
				endDate,
			});

			if (result.status === "failed") {
				console.warn("[pluggy] transaction sync failed for account", {
					userId,
					localItemId,
					localAccountId,
					pluggyAccountId: account.id,
					error: result.error,
				});
			}

			totalTransactions += result.total;
			syncedTransactions += result.synced;
			accountResults.push(result);
		}

		await rebuildExpensesFromStoredTransactions({
			userId,
			localItemId,
		});

		const failedAccounts = accountResults.filter(
			(account) => account.status === "failed",
		);
		transactionsPhase = {
			total: totalTransactions,
			synced: syncedTransactions,
			status: failedAccounts.length > 0 ? "failed" : "success",
			error:
				failedAccounts.length > 0
					? failedAccounts
							.map((account) => account.error)
							.filter(Boolean)
							.join(" | ")
					: undefined,
			accountResults: accountResults,
		};
	} catch (error) {
		if (isPluggyItemNotFoundError(error)) {
			throw error;
		}

		transactionsPhase = failedPhase(
			toPhaseErrorMessage(
				error,
				"Falha ao sincronizar transacoes da Pluggy.",
			),
		);
	}

	return summarizeSyncResult({
		accounts: accountsPhase,
		bills: billsPhase,
		transactions: transactionsPhase,
	});
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
		if (isPluggyItemNotFoundError(error)) {
			throw error;
		}

		return {
			item,
			sync: summarizeSyncResult({
				accounts: failedPhase(
					toPhaseErrorMessage(
						error,
						"Falha ao sincronizar dados iniciais com a Pluggy.",
					),
				),
				bills: skippedPhase(
					"Faturas nao sincronizadas porque a sincronizacao inicial falhou.",
				),
				transactions: skippedPhase(
					"Transacoes nao sincronizadas porque a sincronizacao inicial falhou.",
				),
			}),
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
