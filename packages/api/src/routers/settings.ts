import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { PluggyCredentials } from "../clients/pluggy/types";
import { db } from "../db";
import { type UserSettings, user } from "../db/schema/user";
import { requireSession } from "../index";
import {
	deletePluggyCredentials,
	getPluggyCredentialsStatus,
	MissingPluggyCredentialsError,
	savePluggyCredentials,
} from "../services/connectors/credentials";

const preferencesSchema = z.object({
	theme: z.enum(["light", "dark"]).nullish(),
	/** Monthly income in integer cents (e.g. R$ 4.500,00 → 450000). */
	monthlyIncome: z.coerce.number().int().positive().max(99_999_999_99).nullish(),
	incomeDay: z.coerce.number().int().min(1).max(28).nullish(),
});

const profileSchema = z.object({
	name: z.string().min(1).max(100).nullish(),
	email: z.string().email().max(255).nullish(),
});

const avatarSchema = z.object({
	dataUrl: z.string().max(5 * 1024 * 1024), // 5MB max
});

const pluggyCredentialsSchema = z.object({
	clientId: z.string().min(1),
	clientSecret: z.string().min(1),
});

function mergeSettings(
	base: UserSettings | null,
	patch: Record<string, string | number | null>,
): UserSettings {
	const merged = { ...(base ?? {}) };
	for (const [key, value] of Object.entries(patch)) {
		if (value === undefined) continue;
		(merged as Record<string, unknown>)[key] = value;
	}
	return merged;
}

function sendKnownError(
	reply: { status: (code: number) => { send: (body: unknown) => unknown } },
	error: unknown,
) {
	if ((error as { statusCode?: number }).statusCode === 401) {
		return reply.status(401).send({ error: "Authentication required" });
	}
	if (error instanceof z.ZodError) {
		return reply.status(400).send({ error: error.message });
	}
	if (error instanceof MissingPluggyCredentialsError) {
		return reply.status(error.statusCode).send({ error: error.message });
	}
	throw error;
}

export function registerSettingsRoutes(server: FastifyInstance) {
	// --- Preferences ---

	server.get("/preferences", async (req, reply) => {
		try {
			const session = await requireSession(req.raw);
			const u = await db.query.user.findFirst({
				where: eq(user.id, session.user.id),
				columns: { settings: true },
			});

			const settings = (u?.settings ?? {}) as UserSettings;
			return reply.send({
				theme: settings.theme ?? null,
				monthlyIncome: settings.monthlyIncome ?? null,
				incomeDay: settings.incomeDay ?? null,
			});
		} catch (error) {
			return sendKnownError(reply, error);
		}
	});

	server.patch("/preferences", async (req, reply) => {
		try {
			const session = await requireSession(req.raw);
			const body = preferencesSchema.parse(req.body);

			const u = await db.query.user.findFirst({
				where: eq(user.id, session.user.id),
				columns: { settings: true },
			});

			const merged = mergeSettings(u?.settings as UserSettings | null, body);

			const result = await db
				.update(user)
				.set({ settings: merged })
				.where(eq(user.id, session.user.id))
				.returning({ settings: user.settings });

			const settings = (result[0]?.settings ?? {}) as UserSettings;
			return reply.send({
				theme: settings.theme ?? null,
				monthlyIncome: settings.monthlyIncome ?? null,
				incomeDay: settings.incomeDay ?? null,
			});
		} catch (error) {
			return sendKnownError(reply, error);
		}
	});

	// --- Profile ---

	server.get("/profile", async (req, reply) => {
		try {
			const session = await requireSession(req.raw);
			const u = await db.query.user.findFirst({
				where: eq(user.id, session.user.id),
				columns: { name: true, email: true, image: true },
			});

			if (!u) {
				return reply.status(404).send({ error: "User not found" });
			}

			return reply.send({ name: u.name, email: u.email, image: u.image });
		} catch (error) {
			return sendKnownError(reply, error);
		}
	});

	server.patch("/profile", async (req, reply) => {
		try {
			const session = await requireSession(req.raw);
			const body = profileSchema.parse(req.body);

			const updateData: Record<string, string> = {};
			if (body.name) updateData.name = body.name;
			if (body.email) updateData.email = body.email;

			const result = await db
				.update(user)
				.set(updateData)
				.where(eq(user.id, session.user.id))
				.returning({ name: user.name, email: user.email, image: user.image });

			const row = result[0]!;
			return reply.send({ name: row.name, email: row.email, image: row.image });
		} catch (error) {
			return sendKnownError(reply, error);
		}
	});

	// --- Avatar ---

	server.post("/avatar", async (req, reply) => {
		try {
			const session = await requireSession(req.raw);
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
				.where(eq(user.id, session.user.id))
				.returning({ image: user.image });

			return reply.send({ image: result[0]?.image });
		} catch (error) {
			return sendKnownError(reply, error);
		}
	});

	// --- Pluggy Credentials ---

	server.get("/pluggy/credentials/status", async (req, reply) => {
		try {
			const session = await requireSession(req.raw);
			const status = await getPluggyCredentialsStatus(session.user.id);
			return reply.send(status);
		} catch (error) {
			return sendKnownError(reply, error);
		}
	});

	server.post("/pluggy/credentials", async (req, reply) => {
		try {
			const session = await requireSession(req.raw);
			const body = pluggyCredentialsSchema.parse(req.body) as PluggyCredentials;
			const status = await savePluggyCredentials(session.user.id, body);
			return reply.send(status);
		} catch (error) {
			return sendKnownError(reply, error);
		}
	});

	server.delete("/pluggy/credentials", async (req, reply) => {
		try {
			const session = await requireSession(req.raw);
			await deletePluggyCredentials(session.user.id);
			return reply.send({ configured: false, clientIdMasked: null });
		} catch (error) {
			return sendKnownError(reply, error);
		}
	});
}
