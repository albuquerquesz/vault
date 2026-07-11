import { createPluggyClient } from "../../clients/pluggy";
import type { PluggyCredentials } from "../../clients/pluggy/types";
import type {
	Connector,
	ConnectorProvider,
	CreateConnectTokenInput,
} from "./types";

export const pluggyConnectorProvider: ConnectorProvider = {
	async list(creds: PluggyCredentials): Promise<Connector[]> {
		const client = createPluggyClient(creds);
		const connectors = await client.listConnectors();
		return connectors.map((c) => ({
			id: String(c.id),
			name: c.name,
			imageUrl: c.imageUrl,
		}));
	},

	async createConnectToken(
		creds: PluggyCredentials,
		input: CreateConnectTokenInput,
	) {
		const client = createPluggyClient(creds);
		return client.createConnectToken({
			clientUserId: input.clientUserId,
			...(input.connectorId && { connectorId: input.connectorId }),
		});
	},
};
