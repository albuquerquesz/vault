import type { IncomingMessage, ServerResponse } from "node:http";
import { createServer } from "../src/app.js";

const appPromise = createServer().then(async (app) => {
	await app.ready();
	return app;
});

export default async function handler(
	req: IncomingMessage,
	res: ServerResponse,
) {
	const app = await appPromise;
	app.server.emit("request", req, res);
}
