import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { PluggyAuthError } from "../clients/pluggy";
import { requireSession } from "../index";
import {
	deletePluggyCredentials,
	getPluggyCredentialsStatus,
	MissingPluggyCredentialsError,
	resolvePluggyCredentials,
	savePluggyCredentials,
} from "../services/connectors/credentials";
import { pluggyConnectorProvider } from "../services/connectors";

function sendKnownError(
	reply: { status: (code: number) => { send: (body: unknown) => unknown } },
	error: unknown,
) {
	if ((error as { statusCode?: number }).statusCode === 401) {
		return reply.status(401).send({ error: "Authentication required" });
	}
	if (error instanceof MissingPluggyCredentialsError) {
		return reply.status(error.statusCode).send({ error: error.message });
	}
	if (error instanceof PluggyAuthError) {
		return reply.status(error.statusCode).send({ error: error.message });
	}
	if (error instanceof z.ZodError) {
		return reply.status(400).send({ error: error.message });
	}
	throw error;
}

export function registerConnectorRoutes(server: FastifyInstance) {
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
				const token = await pluggyConnectorProvider.createConnectToken(
					creds,
					{
						clientUserId: session.user.id,
						...(body?.connectorId && { connectorId: body.connectorId }),
					},
				);
				return reply.send(token);
			} catch (error) {
				return sendKnownError(reply, error);
			}
		},
	});
}
