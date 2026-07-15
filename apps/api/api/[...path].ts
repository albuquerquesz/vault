import type { IncomingMessage, ServerResponse } from "node:http";
import { createServer } from "../src/app.js";

const appPromise = createServer().then(async (app) => {
	await app.ready();
	return app;
});

/**
 * Pluggy webhooks can trigger a full item sync (accounts + transactions).
 * Give the function enough time; upserts are idempotent if Pluggy retries.
 */
export const config = {
	maxDuration: 60,
};

export default async function handler(
	req: IncomingMessage,
	res: ServerResponse,
) {
	const app = await appPromise;
	app.server.emit("request", req, res);
}
