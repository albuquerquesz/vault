import { describe, expect, test } from "bun:test";
import type { RouteRegistrar, RouteRequest } from "../hono/registrar.js";
import { registerWebhookRoutes } from "./webhooks.js";

type Sent = { status: number; body: unknown };

function setup() {
	let handler: (req: RouteRequest, reply: unknown) => unknown = () => {};
	registerWebhookRoutes({
		route: (opts: { url: string; handler: typeof handler }) => {
			if (opts.url === "/pluggy") handler = opts.handler;
		},
	} as unknown as RouteRegistrar);

	const logs: Array<{ level: string; msg?: string; obj: unknown }> = [];
	const tasks: Promise<unknown>[] = [];

	const call = async (body: unknown, withWaitUntil: boolean): Promise<Sent> => {
		let status = 200;
		const reply = {
			status(code: number) {
				status = code;
				return reply;
			},
			send(payload?: unknown) {
				return { status, body: payload } as Sent;
			},
		};
		const req = {
			raw: { headers: new Headers() },
			headers: {},
			body,
			query: {},
			params: {},
			waitUntil: withWaitUntil
				? (task: Promise<unknown>) => {
						tasks.push(task);
					}
				: undefined,
			log: {
				info: (obj: unknown, msg?: string) =>
					logs.push({ level: "info", msg, obj }),
				warn: (obj: unknown, msg?: string) =>
					logs.push({ level: "warn", msg, obj }),
				error: (obj: unknown, msg?: string) =>
					logs.push({ level: "error", msg, obj }),
			},
		} as unknown as RouteRequest;
		return (await handler(req, reply)) as Sent;
	};

	return { call, logs, tasks };
}

describe("pluggy webhook route", () => {
	test("answers 200 at once and processes after the response", async () => {
		const { call, logs, tasks } = setup();

		const sent = await call(
			{ event: "connector/status_updated", eventId: "evt-1" },
			true,
		);

		expect(sent.status).toBe(200);
		expect(sent.body).toEqual({
			received: true,
			event: "connector/status_updated",
			eventId: "evt-1",
			accepted: true,
		});
		expect(tasks).toHaveLength(1);

		await tasks[0];
		const processed = logs.find((l) => l.msg === "pluggy webhook processed");
		expect(processed).toBeDefined();
		expect((processed?.obj as { handled: string }).handled).toBe("ignored");
	});

	test("accepts the nulls Pluggy sends for items without a clientUserId", async () => {
		const { call, tasks } = setup();

		const sent = await call(
			{
				event: "item/updated",
				eventId: null,
				itemId: null,
				clientUserId: null,
			},
			true,
		);

		expect(sent.status).toBe(200);
		await Promise.all(tasks);
	});

	test("keeps the synchronous result when there is no execution context", async () => {
		const { call, tasks } = setup();

		const sent = await call(
			{ event: "connector/status_updated", eventId: "evt-2" },
			false,
		);

		expect(sent.status).toBe(200);
		expect((sent.body as { handled: string }).handled).toBe("ignored");
		expect(tasks).toHaveLength(0);
	});

	test("rejects a payload without event with 400", async () => {
		const { call, tasks } = setup();

		const sent = await call({ itemId: "item-1" }, true);

		expect(sent.status).toBe(400);
		expect(tasks).toHaveLength(0);
	});
});
