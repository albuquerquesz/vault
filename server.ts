import Fastify from "fastify";
import { registerServer } from "./apps/api/src/app";

const app = Fastify({
	logger: true,
});

await registerServer(app);
await app.listen({
	host: "0.0.0.0",
	port: Number(process.env.PORT ?? 3000),
});
