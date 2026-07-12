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
