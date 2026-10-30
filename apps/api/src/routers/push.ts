import type { RouteRegistrar, RouteRequest } from "../hono/registrar.js";
import { errorBody } from "../lib/http-errors.js";
import { z } from "zod";
import { env } from "../common/env.js";
import { requireSession } from "../session.js";
import { deletePushSubscription, pushAvailable, revokeDeviceSubscription, savePushSubscription, sendTestPush, validateSubscription } from "../services/push.js";

const subscriptionSchema = z.object({
	endpoint: z.string().max(2048),
	expirationTime: z.number().nullable().optional(),
	keys: z.object({ auth: z.string(), p256dh: z.string() }),
});
const endpointSchema = z.object({ endpoint: z.string().max(2048) });

function validOrigin(req: RouteRequest) {
	const origin = req.headers.origin;
	return typeof origin === "string" && origin === new URL(env.CORS_ORIGIN).origin;
}

export function registerPushRoutes(server: RouteRegistrar) {
	server.get("/config", async (req, reply) => {
		try { await requireSession(req.raw); } catch { return reply.code(401).send(errorBody("UNAUTHORIZED")); }
		return { available: pushAvailable, publicKey: pushAvailable ? env.VAPID_PUBLIC_KEY : null };
	});
	server.post("/subscriptions", async (req, reply) => {
		if (!validOrigin(req)) return reply.code(403).send(errorBody("FORBIDDEN", "Origem da requisição não permitida."));
		let userId: string;
		try { userId = (await requireSession(req.raw)).user.id; } catch { return reply.code(401).send(errorBody("UNAUTHORIZED")); }
		if (!pushAvailable) return reply.code(503).send(errorBody("SERVICE_UNAVAILABLE", "Notificações push indisponíveis no momento."));
		const parsed = subscriptionSchema.safeParse(req.body);
		if (!parsed.success || !validateSubscription(parsed.data)) return reply.code(400).send(errorBody("VALIDATION_ERROR", "Inscrição de notificação inválida."));
		await savePushSubscription(userId, parsed.data);
		return reply.code(204).send();
	});
	server.delete("/subscriptions", async (req, reply) => {
		if (!validOrigin(req)) return reply.code(403).send(errorBody("FORBIDDEN", "Origem da requisição não permitida."));
		let userId: string;
		try { userId = (await requireSession(req.raw)).user.id; } catch { return reply.code(401).send(errorBody("UNAUTHORIZED")); }
		const parsed = endpointSchema.safeParse(req.body);
		if (!parsed.success) return reply.code(400).send(errorBody("VALIDATION_ERROR", "Endpoint de notificação inválido."));
		await deletePushSubscription(userId, parsed.data.endpoint);
		return reply.code(204).send();
	});
	server.delete("/subscriptions/device", async (req, reply) => {
		if (!validOrigin(req)) return reply.code(403).send(errorBody("FORBIDDEN", "Origem da requisição não permitida."));
		try { await requireSession(req.raw); } catch { return reply.code(401).send(errorBody("UNAUTHORIZED")); }
		const parsed = subscriptionSchema.safeParse(req.body);
		if (!parsed.success || !validateSubscription(parsed.data)) return reply.code(400).send(errorBody("VALIDATION_ERROR", "Inscrição de notificação inválida."));
		await revokeDeviceSubscription(parsed.data);
		return reply.code(204).send();
	});
	server.post("/test", async (req, reply) => {
		if (!validOrigin(req)) return reply.code(403).send(errorBody("FORBIDDEN", "Origem da requisição não permitida."));
		let userId: string;
		try { userId = (await requireSession(req.raw)).user.id; } catch { return reply.code(401).send(errorBody("UNAUTHORIZED")); }
		if (!pushAvailable) return reply.code(503).send(errorBody("SERVICE_UNAVAILABLE", "Notificações push indisponíveis no momento."));
		const parsed = endpointSchema.safeParse(req.body);
		if (!parsed.success) return reply.code(400).send(errorBody("VALIDATION_ERROR", "Endpoint de notificação inválido."));
		try {
			const result = await sendTestPush(userId, parsed.data.endpoint);
			if (result === "missing" || result === "expired") return reply.code(404).send(errorBody("NOT_FOUND", "Inscrição de notificação não encontrada ou expirada."));
			if (result === "rate_limited") return reply.code(429).send(errorBody("RATE_LIMITED"));
			return reply.code(204).send();
		} catch { return reply.code(502).send(errorBody("SERVICE_UNAVAILABLE", "Falha temporária ao enviar a notificação. Tente novamente.")); }
	});
}
