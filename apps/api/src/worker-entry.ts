/// <reference types="@cloudflare/workers-types" />

process.env.CF_WORKER = "1";

import { withRequestDb } from "./db/index.js";
import { app } from "./hono/app.js";
import { sendDueDailySummaries } from "./services/daily-summary.js";

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
		const job = env.HYPERDRIVE
			? withRequestDb(env.HYPERDRIVE.connectionString, sendDueDailySummaries)
			: sendDueDailySummaries();
		ctx.waitUntil(job);
	},
};
