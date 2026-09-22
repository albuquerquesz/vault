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
}

export interface PluggyRemoteTransaction {
	id: string;
	date: string;
	amount: number;
	description?: string;
	category?: string;
	accountId: string;
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
		availableCreditLimit?: number;
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
