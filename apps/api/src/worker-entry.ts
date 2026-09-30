/// <reference types="@cloudflare/workers-types" />

process.env.CF_WORKER = "1";

import { app } from "./hono/app.js";
import { sendDueDailySummaries } from "./services/daily-summary.js";

export default {
	fetch: app.fetch,
	async scheduled(
		_controller: ScheduledController,
		_env: unknown,
		ctx: ExecutionContext,
	) {
		ctx.waitUntil(sendDueDailySummaries());
	},
};
