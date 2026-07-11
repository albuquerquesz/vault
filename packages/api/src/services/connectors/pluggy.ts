import { pluggyClient } from "../../clients/pluggy";
import type { Connector, ConnectorProvider } from "./types";

export const pluggyConnectorProvider: ConnectorProvider = {
	async list(): Promise<Connector[]> {
		const connectors = await pluggyClient.listConnectors();
		return connectors.map((c) => ({
			id: c.id,
			name: c.name,
			imageUrl: c.imageUrl,
		}));
	},

	async createConnectToken({ clientUserId, connectorId }) {
		return pluggyClient.createConnectToken({
			clientUserId,
			...(connectorId && { connectorId }),
		});
	},
};
