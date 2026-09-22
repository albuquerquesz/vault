import type { FastifyInstance, FastifyRequest } from "fastify";
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

function validOrigin(req: FastifyRequest) {
	return req.headers.origin === new URL(env.CORS_ORIGIN).origin;
}

export function registerPushRoutes(server: FastifyInstance) {
	server.get("/config", async (req, reply) => {
		try { await requireSession(req.raw); } catch { return reply.code(401).send({ error: "Authentication required" }); }
		return { available: pushAvailable, publicKey: pushAvailable ? env.VAPID_PUBLIC_KEY : null };
	});
	server.post("/subscriptions", async (req, reply) => {
		if (!validOrigin(req)) return reply.code(403).send({ error: "Invalid origin" });
		let userId: string;
		try { userId = (await requireSession(req.raw)).user.id; } catch { return reply.code(401).send({ error: "Authentication required" }); }
		if (!pushAvailable) return reply.code(503).send({ error: "Push unavailable" });
		const parsed = subscriptionSchema.safeParse(req.body);
		if (!parsed.success || !validateSubscription(parsed.data)) return reply.code(400).send({ error: "Invalid subscription" });
		await savePushSubscription(userId, parsed.data);
		return reply.code(204).send();
	});
	server.delete("/subscriptions", async (req, reply) => {
		if (!validOrigin(req)) return reply.code(403).send({ error: "Invalid origin" });
		let userId: string;
		try { userId = (await requireSession(req.raw)).user.id; } catch { return reply.code(401).send({ error: "Authentication required" }); }
		const parsed = endpointSchema.safeParse(req.body);
		if (!parsed.success) return reply.code(400).send({ error: "Invalid endpoint" });
		await deletePushSubscription(userId, parsed.data.endpoint);
		return reply.code(204).send();
	});
	server.delete("/subscriptions/device", async (req, reply) => {
		if (!validOrigin(req)) return reply.code(403).send({ error: "Invalid origin" });
		try { await requireSession(req.raw); } catch { return reply.code(401).send({ error: "Authentication required" }); }
		const parsed = subscriptionSchema.safeParse(req.body);
		if (!parsed.success || !validateSubscription(parsed.data)) return reply.code(400).send({ error: "Invalid subscription" });
		await revokeDeviceSubscription(parsed.data);
		return reply.code(204).send();
	});
	server.post("/test", async (req, reply) => {
		if (!validOrigin(req)) return reply.code(403).send({ error: "Invalid origin" });
		let userId: string;
		try { userId = (await requireSession(req.raw)).user.id; } catch { return reply.code(401).send({ error: "Authentication required" }); }
		if (!pushAvailable) return reply.code(503).send({ error: "Push unavailable" });
		const parsed = endpointSchema.safeParse(req.body);
		if (!parsed.success) return reply.code(400).send({ error: "Invalid endpoint" });
		try {
			const result = await sendTestPush(userId, parsed.data.endpoint);
			if (result === "missing" || result === "expired") return reply.code(404).send({ error: "Subscription unavailable" });
			if (result === "rate_limited") return reply.code(429).send({ error: "Try again later" });
			return reply.code(204).send();
		} catch { return reply.code(502).send({ error: "Push delivery temporarily failed" }); }
	});
}
