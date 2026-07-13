import { createPluggyClient } from "../../clients/pluggy/index.js";
import type { PluggyCredentials } from "../../clients/pluggy/types.js";
import type {
	Connector,
	ConnectorProvider,
	CreateConnectTokenInput,
} from "./types.js";

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
