import { z } from "zod";
import { runInBackground } from "../db/index.js";
import type { RouteRegistrar, RouteRequest } from "../hono/registrar.js";
import {
	describeError,
	errorBody,
	toErrorResponse,
} from "../lib/http-errors.js";
import { isPluggyWebhookSecretValid } from "../services/pluggy-webhook-config.js";
import {
	handlePluggyWebhookEvent,
	type PluggyWebhookPayload,
	parsePluggyWebhookBody,
} from "../services/pluggy-webhooks.js";

/**
 * Runs the event after the response. Pluggy gives up after 10 s and retries,
 * and a sync (accounts, bills, transactions) can take longer than that.
 */
function processInBackground(
	req: RouteRequest,
	payload: PluggyWebhookPayload,
	waitUntil: (task: Promise<unknown>) => void,
) {
	const startedAt = Date.now();
	const task = handlePluggyWebhookEvent(payload).then(
		(result) => {
			req.log.info(
				{
					event: result.event,
					eventId: result.eventId,
					handled: result.handled,
					results: result.results,
					ms: Date.now() - startedAt,
				},
				"pluggy webhook processed",
			);
		},
		(error: unknown) => {
			req.log.error(
				{ event: payload.event, detail: describeError(error) },
				`pluggy webhook handler failure: ${describeError(error)}`,
			);
		},
	);
	runInBackground(task);
	waitUntil(task);
}

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

				if (req.waitUntil) {
					processInBackground(req, payload, req.waitUntil);
					return reply.status(200).send({
						received: true,
						event: payload.event,
						eventId: payload.eventId ?? undefined,
						accepted: true,
					});
				}

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
