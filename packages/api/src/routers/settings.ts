import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { user, type UserSettings } from "../db/schema/user";
import { db } from "../db";
import { z } from "zod";
import { requireSession } from "../index";

const preferencesSchema = z.object({
	theme: z.enum(["light", "dark"]).nullish(),
	monthlyIncome: z.coerce.number().positive().max(999999999).nullish(),
	incomeDay: z.coerce.number().int().min(1).max(28).nullish(),
});

const profileSchema = z.object({
	name: z.string().min(1).max(100).nullish(),
	email: z.string().email().max(255).nullish(),
});

const avatarSchema = z.object({
	dataUrl: z.string().max(5 * 1024 * 1024), // 5MB max
});

function mergeSettings(base: UserSettings | null, patch: Record<string, string | number | null>): UserSettings {
	const merged = { ...(base ?? {}) };
	for (const [key, value] of Object.entries(patch)) {
		if (value === undefined) continue;
		(merged as Record<string, unknown>)[key] = value;
	}
	return merged;
}

export function registerSettingsRoutes(server: FastifyInstance) {
	// --- Preferences ---

	server.get("/preferences", {
		preHandler: [requireSession],
	}, async (req, reply) => {
		const userId = (req as any).session.user.id;

		const u = await db.query.user.findFirst({
			where: eq(user.id, userId),
			columns: { settings: true },
		});

		const settings = (u?.settings ?? {}) as UserSettings;
		return reply.send({
			theme: settings.theme ?? null,
			monthlyIncome: settings.monthlyIncome ?? null,
			incomeDay: settings.incomeDay ?? null,
		});
	});

	server.patch("/preferences", {
		preHandler: [requireSession],
	}, async (req, reply) => {
		const userId = (req as any).session.user.id;
		const body = preferencesSchema.parse(req.body);

		const u = await db.query.user.findFirst({
			where: eq(user.id, userId),
			columns: { settings: true },
		});

		const merged = mergeSettings(u?.settings as UserSettings | null, body);

		const result = await db
			.update(user)
			.set({ settings: merged })
			.where(eq(user.id, userId))
			.returning({ settings: user.settings });

		const settings = (result[0]!.settings ?? {}) as UserSettings;
		return reply.send({
			theme: settings.theme ?? null,
			monthlyIncome: settings.monthlyIncome ?? null,
			incomeDay: settings.incomeDay ?? null,
		});
	});

	// --- Profile ---

	server.get("/profile", {
		preHandler: [requireSession],
	}, async (req, reply) => {
		const userId = (req as any).session.user.id;

		const u = await db.query.user.findFirst({
			where: eq(user.id, userId),
			columns: { name: true, email: true, image: true },
		});

		if (!u) {
			return reply.status(404).send({ error: "User not found" });
		}

		return reply.send({ name: u.name, email: u.email, image: u.image });
	});

	server.patch("/profile", {
		preHandler: [requireSession],
	}, async (req, reply) => {
		const userId = (req as any).session.user.id;
		const body = profileSchema.parse(req.body);

		const updateData: Record<string, string> = {};
		if (body.name) updateData.name = body.name;
		if (body.email) updateData.email = body.email;

		const result = await db
			.update(user)
			.set(updateData)
			.where(eq(user.id, userId))
			.returning({ name: user.name, email: user.email, image: user.image });

		const row = result[0]!;
		return reply.send({ name: row.name, email: row.email, image: row.image });
	});

	// --- Avatar ---

	server.post("/avatar", {
		preHandler: [requireSession],
	}, async (req, reply) => {
		const userId = (req as any).session.user.id;
		const body = avatarSchema.parse(req.body);

		// Validate it's an image data URL
		if (!body.dataUrl.startsWith("data:image/")) {
			return reply.status(400).send({ error: "Invalid image format" });
		}

		// Check size (base64 padding inflates by ~33%)
		const base64Data = body.dataUrl.split(",")[1] ?? "";
		const rawSize = Math.round((base64Data.length * 3) / 4);
		if (rawSize > 5 * 1024 * 1024) {
			return reply.status(400).send({ error: "Image too large (max 5MB)" });
		}

		const result = await db
			.update(user)
			.set({ image: body.dataUrl })
			.where(eq(user.id, userId))
			.returning({ image: user.image });

		return reply.send({ image: result[0]!.image });
	});
}