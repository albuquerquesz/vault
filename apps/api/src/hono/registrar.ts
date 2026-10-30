import type { Context, Hono } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { describeError, toErrorResponse } from "../lib/http-errors.js";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type RouteRequest = {
	raw: { headers: Headers };
	headers: Record<string, string | string[] | undefined>;
	body: unknown;
	query: Record<string, string | undefined>;
	params: Record<string, string>;
	log: {
		info: (obj: unknown, msg?: string) => void;
		warn: (obj: unknown, msg?: string) => void;
		error: (obj: unknown, msg?: string) => void;
	};
};

export type RouteReply = {
	status: (code: number) => RouteReply;
	code: (code: number) => RouteReply;
	send: (body?: unknown) => Response | Promise<Response>;
	header: (name: string, value: string | string[]) => RouteReply;
};

export type RouteRegistrar = {
	route: (opts: {
		method: HttpMethod | HttpMethod[];
		url: string;
		handler: (req: RouteRequest, reply: RouteReply) => unknown;
	}) => void;
	get: (
		url: string,
		handler: (req: RouteRequest, reply: RouteReply) => unknown,
	) => void;
	post: (
		url: string,
		handler: (req: RouteRequest, reply: RouteReply) => unknown,
	) => void;
	patch: (
		url: string,
		handler: (req: RouteRequest, reply: RouteReply) => unknown,
	) => void;
	delete: (
		url: string,
		handler: (req: RouteRequest, reply: RouteReply) => unknown,
	) => void;
	put: (
		url: string,
		handler: (req: RouteRequest, reply: RouteReply) => unknown,
	) => void;
};

function headersRecord(
	c: Context,
): Record<string, string | string[] | undefined> {
	const out: Record<string, string | string[] | undefined> = {};
	c.req.raw.headers.forEach((value, key) => {
		const existing = out[key];
		if (existing === undefined) {
			out[key] = value;
		} else if (Array.isArray(existing)) {
			existing.push(value);
		} else {
			out[key] = [existing, value];
		}
	});
	return out;
}

async function buildRequest(c: Context): Promise<RouteRequest> {
	let body: unknown;
	const method = c.req.method;
	if (method !== "GET" && method !== "HEAD") {
		const contentType = c.req.header("content-type") ?? "";
		if (contentType.includes("application/json")) {
			try {
				body = await c.req.json();
			} catch {
				body = undefined;
			}
		} else {
			const text = await c.req.text();
			body = text.length > 0 ? text : undefined;
		}
	}

	const query: Record<string, string | undefined> = {};
	for (const [key, value] of Object.entries(c.req.query())) {
		query[key] = value;
	}

	return {
		raw: { headers: c.req.raw.headers },
		headers: headersRecord(c),
		body,
		query,
		params: c.req.param() as Record<string, string>,
		log: {
			info: (obj, msg) => console.info(msg ?? "info", obj),
			warn: (obj, msg) => console.warn(msg ?? "warn", obj),
			error: (obj, msg) => console.error(msg ?? "error", obj),
		},
	};
}

function createReply(c: Context): RouteReply {
	let statusCode = 200;
	const responseHeaders = new Headers();

	const reply: RouteReply = {
		status(code: number) {
			statusCode = code;
			return reply;
		},
		code(code: number) {
			statusCode = code;
			return reply;
		},
		header(name: string, value: string | string[]) {
			if (Array.isArray(value)) {
				for (const v of value) {
					responseHeaders.append(name, v);
				}
			} else {
				responseHeaders.set(name, value);
			}
			return reply;
		},
		send(body?: unknown) {
			if (statusCode === 204 || body === undefined || body === null) {
				return new Response(null, {
					status: statusCode,
					headers: responseHeaders,
				});
			}
			if (typeof body === "string") {
				for (const [k, v] of responseHeaders.entries()) {
					c.header(k, v);
				}
				return new Response(body, {
					status: statusCode,
					headers: responseHeaders,
				});
			}
			responseHeaders.set("content-type", "application/json");
			return new Response(JSON.stringify(body), {
				status: statusCode,
				headers: responseHeaders,
			});
		},
	};

	return reply;
}

async function runHandler(
	c: Context,
	handler: (req: RouteRequest, reply: RouteReply) => unknown,
) {
	try {
		const req = await buildRequest(c);
		const reply = createReply(c);
		const result = await handler(req, reply);
		if (result instanceof Response) {
			return result;
		}
		if (result !== undefined && result !== null) {
			return c.json(result);
		}
		return c.text("", 500);
	} catch (error) {
		const { status, body } = toErrorResponse(error);
		const route = `${c.req.method} ${new URL(c.req.url).pathname}`;
		// Log as a string: Workers observability drops the message of Error objects.
		console.error(
			`route handler error [${body.code}] ${route}: ${describeError(error)}`,
		);
		return c.json(body, status as ContentfulStatusCode);
	}
}

function registerMethod(
	app: Hono,
	methods: HttpMethod | HttpMethod[],
	path: string,
	handler: (req: RouteRequest, reply: RouteReply) => unknown,
) {
	const list = Array.isArray(methods) ? methods : [methods];
	for (const method of list) {
		app.on(method, path, (c) => runHandler(c, handler));
	}
}

export function createRouteRegistrar(app: Hono): RouteRegistrar {
	return {
		route({ method, url, handler }) {
			registerMethod(app, method, url, handler);
		},
		get(url, handler) {
			registerMethod(app, "GET", url, handler);
		},
		post(url, handler) {
			registerMethod(app, "POST", url, handler);
		},
		patch(url, handler) {
			registerMethod(app, "PATCH", url, handler);
		},
		delete(url, handler) {
			registerMethod(app, "DELETE", url, handler);
		},
		put(url, handler) {
			registerMethod(app, "PUT", url, handler);
		},
	};
}
