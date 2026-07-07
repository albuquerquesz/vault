import type { FastifyInstance } from "fastify";
import { registerFinanceRoutes } from "./finance";
import { registerPluggyRoutes } from "./pluggy";

export async function registerRoutes(server: FastifyInstance) {
	server.register(async (s) => { registerFinanceRoutes(s); }, { prefix: "/api/finance" });
	server.register(async (s) => { registerPluggyRoutes(s); }, { prefix: "/api/pluggy" });
}
