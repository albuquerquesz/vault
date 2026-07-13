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

export interface PluggyItem {
	id: string;
	status: string;
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
