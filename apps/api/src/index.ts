import { createServer } from "./app";

const fastify = await createServer();

try {
	await fastify.listen({
		host: "0.0.0.0",
		port: Number(process.env.PORT ?? 3000),
	});
	console.log("Server running on port", process.env.PORT ?? 3000);
} catch (error) {
	fastify.log.error(error);
	process.exit(1);
}
