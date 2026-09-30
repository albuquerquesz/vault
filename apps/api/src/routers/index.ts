import type { Hono } from "hono";
import { Hono as HonoCtor } from "hono";
import { createRouteRegistrar } from "../hono/registrar.js";
import { registerConnectorRoutes } from "./connectors.js";
import { registerFinanceRoutes } from "./finance.js";
import { registerPluggyRoutes } from "./pluggy.js";
import { registerPushRoutes } from "./push.js";
import { registerSettingsRoutes } from "./settings.js";
import { registerWebhookRoutes } from "./webhooks.js";

export function registerRoutes(app: Hono) {
	const mount = (
		prefix: string,
		register: (server: ReturnType<typeof createRouteRegistrar>) => void,
	) => {
		const sub = new HonoCtor();
		register(createRouteRegistrar(sub));
		app.route(prefix, sub);
	};

	mount("/api/push", registerPushRoutes);
	mount("/api/finance", registerFinanceRoutes);
	mount("/api/pluggy", registerPluggyRoutes);
	mount("/api/connectors", registerConnectorRoutes);
	mount("/api/settings", registerSettingsRoutes);
	mount("/api/webhooks", registerWebhookRoutes);
}
