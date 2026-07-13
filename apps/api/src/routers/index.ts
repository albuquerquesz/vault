import type { FastifyInstance } from "fastify";
import { registerConnectorRoutes } from "./connectors.js";
import { registerFinanceRoutes } from "./finance.js";
import { registerPluggyRoutes } from "./pluggy.js";
import { registerSettingsRoutes } from "./settings.js";
import { registerWebhookRoutes } from "./webhooks.js";

export async function registerRoutes(server: FastifyInstance) {
	server.register(async (s) => { registerFinanceRoutes(s); }, { prefix: "/api/finance" });
	server.register(async (s) => { registerPluggyRoutes(s); }, { prefix: "/api/pluggy" });
	server.register(async (s) => { registerConnectorRoutes(s); }, { prefix: "/api/connectors" });
	server.register(async (s) => { registerSettingsRoutes(s); }, { prefix: "/api/settings" });
	server.register(async (s) => { registerWebhookRoutes(s); }, { prefix: "/api/webhooks" });
}
