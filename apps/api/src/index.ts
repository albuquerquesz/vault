import fastifyCors from "@fastify/cors";
import { auth } from "@vault/api/auth";
import { env } from "@vault/api/common/env";
import { registerRoutes } from "@vault/api/routers/index";
import Fastify from "fastify";

const baseCorsConfig = {
	origin: env.CORS_ORIGIN,
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
	credentials: true,
	maxAge: 86400,
};

const fastify = Fastify({
	logger: true,
});

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

fastify.get("/", async () => {
	return "OK";
});

fastify.post("/api/webhooks/pluggy", async (req, reply) => {
	const body = req.body as { event?: string } | undefined;
	if (body?.event === "item.synced") {
		// Trigger transaction sync for the item
	}
	reply.code(200).send({ received: true });
});

fastify.listen({ port: 3000 }, (err) => {
	if (err) {
		fastify.log.error(err);
		process.exit(1);
	}
	console.log("Server running on port 3000");
});
