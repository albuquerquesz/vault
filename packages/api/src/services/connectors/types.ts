import type { PluggyCredentials } from "../../clients/pluggy/types";

export interface Connector {
	id: string;
	name: string;
	imageUrl: string;
}

export interface CreateConnectTokenInput {
	clientUserId: string;
	connectorId?: string;
}

export interface ConnectorProvider {
	list(creds: PluggyCredentials): Promise<Connector[]>;
	createConnectToken(
		creds: PluggyCredentials,
		input: CreateConnectTokenInput,
	): Promise<{ accessToken: string }>;
}
