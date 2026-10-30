import { z } from "zod";
import type { RouteRegistrar } from "../hono/registrar.js";
import {
	describeError,
	errorBody,
	toErrorResponse,
} from "../lib/http-errors.js";
import { isPluggyWebhookSecretValid } from "../services/pluggy-webhook-config.js";
import {
	handlePluggyWebhookEvent,
	parsePluggyWebhookBody,
} from "../services/pluggy-webhooks.js";

/**
 * Public (unauthenticated) webhook receivers.
 * Pluggy POSTs JSON events here after item auto-sync / product changes.
 */
export function registerWebhookRoutes(server: RouteRegistrar) {
	server.route({
		method: "POST",
		url: "/pluggy",
		async handler(req, reply) {
			if (!isPluggyWebhookSecretValid(req.headers as Record<string, unknown>)) {
				return reply
					.status(401)
					.send(errorBody("UNAUTHORIZED", "Segredo do webhook inválido."));
			}

			try {
				const payload = parsePluggyWebhookBody(req.body);
				const result = await handlePluggyWebhookEvent(payload);

				req.log.info(
					{
						event: result.event,
						eventId: result.eventId,
						handled: result.handled,
						results: result.results,
					},
					"pluggy webhook processed",
				);

				// Always 200 for known payload shapes so Pluggy does not thrash
				// retries on unknown items / partial product failures. Upserts are
				// idempotent if Pluggy does retry.
				return reply.status(200).send(result);
			} catch (error) {
				if (error instanceof z.ZodError) {
					req.log.warn({ err: error }, "pluggy webhook invalid payload");
					return reply.status(400).send({
						...errorBody("VALIDATION_ERROR", "Payload de webhook inválido."),
						details: error.flatten(),
					});
				}

				const { status, body } = toErrorResponse(error);
				req.log.error(
					{ code: body.code, detail: describeError(error) },
					`pluggy webhook handler failure: ${describeError(error)}`,
				);
				// 5xx triggers Pluggy retry — appropriate for unexpected failures.
				return reply.status(status >= 500 ? status : 500).send(body);
			}
		},
	});
}
