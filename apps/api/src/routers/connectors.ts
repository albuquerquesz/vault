import { z } from "zod";
import type { RouteRegistrar } from "../hono/registrar.js";
import { sendKnownError } from "../lib/http-errors.js";
import {
	deletePluggyCredentials,
	getPluggyCredentialsStatus,
	resolvePluggyCredentials,
	savePluggyCredentials,
} from "../services/connectors/credentials.js";
import { pluggyConnectorProvider } from "../services/connectors/index.js";
import { requireSession } from "../session.js";

export function registerConnectorRoutes(server: RouteRegistrar) {
	server.route({
		method: "GET",
		url: "/credentials",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const status = await getPluggyCredentialsStatus(session.user.id);
				return reply.send(status);
			} catch (error) {
				return sendKnownError(reply, error);
			}
		},
	});

	server.route({
		method: "PUT",
		url: "/credentials",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const body = z
					.object({
						clientId: z.string().min(1),
						clientSecret: z.string().min(1),
					})
					.parse(req.body);

				const status = await savePluggyCredentials(session.user.id, body);
				return reply.send(status);
			} catch (error) {
				return sendKnownError(reply, error);
			}
		},
	});

	server.route({
		method: "DELETE",
		url: "/credentials",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				await deletePluggyCredentials(session.user.id);
				return reply.code(204).send();
			} catch (error) {
				return sendKnownError(reply, error);
			}
		},
	});

	server.route({
		method: "GET",
		url: "/",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const creds = await resolvePluggyCredentials(session.user.id);
				const connectors = await pluggyConnectorProvider.list(creds);
				return reply.send(connectors);
			} catch (error) {
				return sendKnownError(reply, error);
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
				const creds = await resolvePluggyCredentials(session.user.id);
				const token = await pluggyConnectorProvider.createConnectToken(creds, {
					clientUserId: session.user.id,
					...(body?.connectorId && { connectorId: body.connectorId }),
				});
				return reply.send(token);
			} catch (error) {
				return sendKnownError(reply, error);
			}
		},
	});
}
