import type { FastifyInstance } from "fastify";
import { registerConnectorRoutes } from "./connectors";
import { registerFinanceRoutes } from "./finance";
import { registerPluggyRoutes } from "./pluggy";
import { registerSettingsRoutes } from "./settings";
import { registerWebhookRoutes } from "./webhooks";

export async function registerRoutes(server: FastifyInstance) {
	server.register(
		async (s) => {
			registerFinanceRoutes(s);
		},
		{ prefix: "/api/finance" },
	);
	server.register(
		async (s) => {
			registerPluggyRoutes(s);
		},
		{ prefix: "/api/pluggy" },
	);
	server.register(
		async (s) => {
			registerConnectorRoutes(s);
		},
		{ prefix: "/api/connectors" },
	);
	server.register(
		async (s) => {
			registerSettingsRoutes(s);
		},
		{ prefix: "/api/settings" },
	);
	server.register(
		async (s) => {
			registerWebhookRoutes(s);
		},
		{ prefix: "/api/webhooks" },
	);
}
