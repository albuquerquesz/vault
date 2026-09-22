import { timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { env } from "../../src/db/env.js";
import { sendDueDailySummaries } from "../../src/services/daily-summary.js";

export const config = { maxDuration: 60 };

export default async function handler(
	req: IncomingMessage,
	res: ServerResponse,
) {
	if (req.method !== "GET" && req.method !== "POST") {
		res.statusCode = 405;
		res.end("Method not allowed");
		return;
	}
	const expected = env.CRON_SECRET;
	const authorization = req.headers.authorization ?? "";
	const received = authorization.startsWith("Bearer ")
		? authorization.slice(7)
		: "";
	if (
		!expected ||
		received.length !== expected.length ||
		!timingSafeEqual(Buffer.from(received), Buffer.from(expected))
	) {
		res.statusCode = 401;
		res.end("Unauthorized");
		return;
	}
	try {
		const result = await sendDueDailySummaries();
		res.setHeader("content-type", "application/json");
		res.end(JSON.stringify(result));
	} catch {
		res.statusCode = 500;
		res.end("Daily summary failed");
	}
}
