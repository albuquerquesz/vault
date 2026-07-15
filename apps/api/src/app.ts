import fastifyCors from "@fastify/cors";
import Fastify, { type FastifyInstance } from "fastify";
import { auth } from "./auth.js";
import { env } from "./common/env.js";
import { registerRoutes } from "./routers/index.js";

const frontAuthErrorUrlBase = `${env.CORS_ORIGIN.replace(/\/$/, "")}/auth/error`;

function buildFrontAuthErrorUrl(
	query: Record<string, string | undefined>,
): string {
	const url = new URL(frontAuthErrorUrlBase);

	for (const key of ["error", "error_description", "state"]) {
		const value = query[key];
		if (value) {
			url.searchParams.set(key, value);
		}
	}

	return url.toString();
}

const baseCorsConfig = {
	origin: env.CORS_ORIGIN,
	methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
	credentials: true,
	maxAge: 86400,
};

export async function registerServer(fastify: FastifyInstance) {
	fastify.register(fastifyCors, baseCorsConfig);

	fastify.route({
		method: ["GET", "POST"],
		url: "/api/auth/*",
		async handler(request, reply) {
			try {
				const url = new URL(request.url, `http://${request.headers.host}`);
				const headers = new Headers();

				Object.entries(request.headers).forEach(([key, value]) => {
					if (value) headers.append(key, value.toString());
				});

				const req = new Request(url.toString(), {
					method: request.method,
					headers,
					body: request.body ? JSON.stringify(request.body) : undefined,
				});

				const response = await auth.handler(req);
				reply.status(response.status);
				response.headers.forEach((value, key) => {
					reply.header(key, value);
				});

				reply.send(response.body ? await response.text() : null);
			} catch (error) {
				fastify.log.error({ err: error }, "Authentication Error:");
				reply.status(500).send({
					error: "Internal authentication error",
					code: "AUTH_FAILURE",
				});
			}
		},
	});

	await registerRoutes(fastify);

	fastify.get("/", async (request, reply) => {
		const query = request.query as Record<string, string | undefined>;
		if (query.error || query.state) {
			return reply.redirect(buildFrontAuthErrorUrl(query));
		}

		return "OK";
	});

	fastify.get("/error", async (request, reply) => {
		const query = request.query as Record<string, string | undefined>;
		return reply.redirect(buildFrontAuthErrorUrl(query));
	});
}

export async function createServer() {
	const fastify = Fastify({
		logger: true,
	});

	await registerServer(fastify);

	return fastify;
}
