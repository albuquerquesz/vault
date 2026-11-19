/// <reference types="@cloudflare/workers-types" />

process.env.CF_WORKER = "1";

import { withRequestDb } from "./db/index.js";
import { app } from "./hono/app.js";
import { sendDueDailySummaries } from "./services/daily-summary.js";
import { requestPluggyItemRefreshes } from "./services/pluggy-refresh.js";

type WorkerEnv = {
	/** Hyperdrive binding to Neon; absent in environments without it. */
	HYPERDRIVE?: Hyperdrive;
};

export default {
	fetch(request: Request, env: WorkerEnv, ctx: ExecutionContext) {
		if (!env.HYPERDRIVE) {
			return app.fetch(request, env, ctx);
		}
		return withRequestDb(
			env.HYPERDRIVE.connectionString,
			async () => app.fetch(request, env, ctx),
			(promise) => ctx.waitUntil(promise),
		);
	},
	async scheduled(
		_controller: ScheduledController,
		env: WorkerEnv,
		ctx: ExecutionContext,
	) {
		// Each job gets its own connection and one failing never stops the other.
		const run = <T>(fn: () => Promise<T>) =>
			env.HYPERDRIVE ? withRequestDb(env.HYPERDRIVE.connectionString, fn) : fn();
		const guarded = <T>(name: string, fn: () => Promise<T>) =>
			run(fn).catch((error) => {
				console.error(`[cron] ${name} failed`, error);
			});

		ctx.waitUntil(
			Promise.all([
				guarded("daily summaries", sendDueDailySummaries),
				guarded("pluggy item refresh", requestPluggyItemRefreshes),
			]),
		);
	},
};
