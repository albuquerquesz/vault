import type { FastifyInstance } from "fastify";
import { requireSession } from "../index";
import { pluggyConnectorProvider } from "../services/connectors";

export function registerConnectorRoutes(server: FastifyInstance) {
	server.route({
		method: "GET",
		url: "/",
		async handler(req, reply) {
			try {
				await requireSession(req.raw);
				const connectors = await pluggyConnectorProvider.list();
				return reply.send(connectors);
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send({ error: "Authentication required" });
				throw error;
			}
		},
	});

	server.route({
		method: "POST",
		url: "/token",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const body = req.body as { connectorId?: string } | undefined;
				const token = await pluggyConnectorProvider.createConnectToken({
					clientUserId: session.user.id,
					...(body?.connectorId && { connectorId: body.connectorId }),
				});
				return reply.send(token);
			} catch (error) {
				if ((error as { statusCode?: number }).statusCode === 401)
					return reply.status(401).send({ error: "Authentication required" });
				throw error;
			}
		},
	});
}
