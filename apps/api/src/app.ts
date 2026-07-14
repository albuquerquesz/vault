import fastifyCors from "@fastify/cors";
import Fastify, { type FastifyInstance } from "fastify";
import { auth } from "./auth.js";
import { env } from "./common/env.js";
import { registerRoutes } from "./routers/index.js";

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

	fastify.get("/", async () => "OK");
}

export async function createServer() {
	const fastify = Fastify({
		logger: true,
	});

	await registerServer(fastify);

	return fastify;
}
