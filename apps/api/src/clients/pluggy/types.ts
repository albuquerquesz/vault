export interface PluggyCredentials {
	clientId: string;
	clientSecret: string;
}

export interface PluggyConnectToken {
	accessToken: string;
}

export interface CreatePluggyConnectTokenInput {
	itemId?: string;
	clientUserId?: string;
	connectorId?: string;
	/** HTTPS URL that receives item-scoped Pluggy webhook events. */
	webhookUrl?: string;
}

/** Pluggy webhook event names we care about for data sync. */
export type PluggyWebhookEvent =
	| "all"
	| "item/created"
	| "item/updated"
	| "item/error"
	| "item/deleted"
	| "item/waiting_user_input"
	| "item/waiting_user_action"
	| "item/login_succeeded"
	| "connector/status_updated"
	| "transactions/created"
	| "transactions/updated"
	| "transactions/deleted"
	| (string & {});

export interface RegisterPluggyWebhookInput {
	url: string;
	event: PluggyWebhookEvent;
	headers?: Record<string, string>;
}

export interface PluggyWebhookRegistration {
	id: string;
	url?: string;
	event?: string;
}

export interface PluggyTransaction {
	id: string;
	date: string;
	amount: number;
	description?: string;
	category?: string;
	accountId: string;
	/** Credit card only: the bill the transaction belongs to, once billed, and the installment. */
	creditCardMetadata?: {
		billId?: string | null;
		installmentNumber?: number | null;
		totalInstallments?: number | null;
	} | null;
}

export interface PluggyRemoteTransaction {
	id: string;
	date: string;
	amount: number;
	description?: string;
	category?: string;
	accountId: string;
	/** Credit card only: the bill the transaction belongs to, once billed, and the installment. */
	creditCardMetadata?: {
		billId?: string | null;
		installmentNumber?: number | null;
		totalInstallments?: number | null;
	} | null;
}

export interface PluggyTransactionsPage {
	results: PluggyRemoteTransaction[];
	next?: string | null;
}

export interface PluggyTransactionsFetchResult {
	transactions: PluggyTransaction[];
	error?: string;
}

export interface PluggyAccount {
	id: string;
	itemId: string;
	type: "BANK" | "CREDIT";
	subtype?: string;
	name?: string;
	balance?: number;
	availableBalance?: number;
	currency?: string;
	transferNumber?: string;
	brand?: string;
	status?: string;
	/** Credit cards only. */
	creditLimit?: number;
	availableCreditLimit?: number;
	balanceCloseDate?: string;
	balanceDueDate?: string;
	minimumPayment?: number;
}

export interface PluggyRemoteAccount {
	id: string;
	itemId: string;
	type: "BANK" | "CREDIT";
	subtype?: string;
	name?: string;
	balance?: number;
	currencyCode?: string;
	number?: string;
	createdAt?: string;
	updatedAt?: string;
	bankData?: {
		transferNumber?: string;
		closingBalance?: number;
		availableBalance?: number;
	};
	creditData?: {
		brand?: string | null;
		level?: string | null;
		status?: string | null;
		availableCreditLimit?: number | null;
		creditLimit?: number | null;
		balanceCloseDate?: string | null;
		balanceDueDate?: string | null;
		minimumPayment?: number | null;
	};
	status?: string;
}

export interface PluggyAccountsPage {
	page: number;
	total: number;
	totalPages: number;
	results: PluggyRemoteAccount[];
}

export interface PluggyBillPayment {
	id?: string;
	amount: number;
	paymentDate?: string;
	valueType?: string;
	paymentMode?: string;
	currencyCode?: string;
}

export interface PluggyBillFinanceCharge {
	id?: string;
	type?: string;
	amount: number;
	currencyCode?: string;
	additionalInfo?: string;
}

/** Normalized credit-card bill from GET /bills?accountId= */
export interface PluggyBill {
	id: string;
	dueDate: string;
	billClosingDate?: string;
	totalAmount: number;
	totalAmountCurrencyCode?: string;
	minimumPaymentAmount?: number;
	allowsInstallments?: boolean;
	payments: PluggyBillPayment[];
	financeCharges: PluggyBillFinanceCharge[];
}

export interface PluggyRemoteBill {
	id: string;
	dueDate: string;
	billClosingDate?: string | null;
	totalAmount: number;
	totalAmountCurrencyCode?: string;
	minimumPaymentAmount?: number | null;
	allowsInstallments?: boolean;
	payments?: PluggyBillPayment[];
	financeCharges?: PluggyBillFinanceCharge[];
}

export interface PluggyBillsPage {
	page: number;
	total: number;
	totalPages: number;
	results: PluggyRemoteBill[];
}

export interface PluggyItem {
	id: string;
	status: string;
	lastUpdatedAt?: string | null;
	nextAutoSyncAt?: string | null;
	connector?: {
		id: number;
		name?: string;
	};
	connectorId?: number;
}

export interface PluggyConnector {
	id: string;
	name: string;
	imageUrl: string;
	type: string;
	isOpenFinance: boolean;
}

/** Investment classes returned by `GET /investments` (docs: reference/Investment). */
export const PLUGGY_INVESTMENT_TYPES = [
	"COE",
	"EQUITY",
	"ETF",
	"FIXED_INCOME",
	"MUTUAL_FUND",
	"SECURITY",
	"OTHER",
] as const;

export type PluggyInvestmentType = (typeof PLUGGY_INVESTMENT_TYPES)[number];

/** One investment position, already parsed defensively (see `normalizeInvestment`). */
export interface PluggyInvestment {
	id: string;
	itemId?: string;
	name: string;
	/** Unknown classes from Pluggy fall back to OTHER. */
	type: PluggyInvestmentType;
	subtype: string | null;
	institution: string | null;
	/** Current net balance (after fees and taxes). */
	balance: number;
	/** `amountOriginal`: what was originally invested. Null when the provider does not say. */
	amountInvested: number | null;
	/** `amountProfit`: only some direct connectors send it; Open Finance sends null. */
	amountProfit: number | null;
	currency: string;
	/** ACTIVE, PENDING or TOTAL_WITHDRAWAL; null when absent. */
	status: string | null;
	/** Reference date of the position, ISO string; null when absent. */
	date: string | null;
}
