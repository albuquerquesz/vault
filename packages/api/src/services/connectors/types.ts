export interface Connector {
	id: string;
	name: string;
	imageUrl: string;
}

export interface ConnectorProvider {
	list(): Promise<Connector[]>;
	createConnectToken(input: { clientUserId: string; connectorId?: string }): Promise<{ accessToken: string }>;
}
