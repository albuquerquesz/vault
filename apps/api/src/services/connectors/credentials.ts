import { eq } from "drizzle-orm";
import {
	authenticatePluggy,
	clearPluggyApiKeyCache,
	createPluggyClient,
	type PluggyClient,
} from "../../clients/pluggy/index.js";
import type { PluggyCredentials } from "../../clients/pluggy/types.js";
import { db } from "../../db/index.js";
import { pluggyCredentials } from "../../db/schema/index.js";
import {
	decryptSecret,
	encryptSecret,
	maskClientId,
} from "../../lib/secret-crypto.js";

export class MissingPluggyCredentialsError extends Error {
	statusCode = 400;

	constructor(
		message = "Configure suas credenciais Pluggy (Client ID e Client Secret) nas configurações",
	) {
		super(message);
		this.name = "MissingPluggyCredentialsError";
	}
}

export type PluggyCredentialsStatus = {
	configured: boolean;
	clientIdMasked: string | null;
};

export async function getPluggyCredentialsStatus(
	userId: string,
): Promise<PluggyCredentialsStatus> {
	const row = await db
		.select({
			clientId: pluggyCredentials.clientId,
		})
		.from(pluggyCredentials)
		.where(eq(pluggyCredentials.userId, userId))
		.limit(1)
		.then((r) => r[0]);

	if (row) {
		return {
			configured: true,
			clientIdMasked: maskClientId(row.clientId),
		};
	}

	return {
		configured: false,
		clientIdMasked: null,
	};
}

/** Only the user's own BYOK credentials — never shared platform keys. */
export async function resolvePluggyCredentials(
	userId: string,
): Promise<PluggyCredentials> {
	const row = await db
		.select()
		.from(pluggyCredentials)
		.where(eq(pluggyCredentials.userId, userId))
		.limit(1)
		.then((r) => r[0]);

	if (row) {
		return {
			clientId: row.clientId,
			clientSecret: decryptSecret(row.clientSecretCiphertext),
		};
	}

	throw new MissingPluggyCredentialsError();
}

export async function getPluggyClientForUser(
	userId: string,
): Promise<PluggyClient> {
	const creds = await resolvePluggyCredentials(userId);
	return createPluggyClient(creds);
}

export async function savePluggyCredentials(
	userId: string,
	input: PluggyCredentials,
): Promise<PluggyCredentialsStatus> {
	// Validate with Pluggy before storing.
	await authenticatePluggy(input);

	const ciphertext = encryptSecret(input.clientSecret);

	const existing = await db
		.select({ userId: pluggyCredentials.userId })
		.from(pluggyCredentials)
		.where(eq(pluggyCredentials.userId, userId))
		.limit(1)
		.then((r) => r[0]);

	if (existing) {
		await db
			.update(pluggyCredentials)
			.set({
				clientId: input.clientId,
				clientSecretCiphertext: ciphertext,
				updatedAt: new Date(),
			})
			.where(eq(pluggyCredentials.userId, userId));
	} else {
		await db.insert(pluggyCredentials).values({
			userId,
			clientId: input.clientId,
			clientSecretCiphertext: ciphertext,
		});
	}

	clearPluggyApiKeyCache(input.clientId);

	// Best-effort: register client-level webhook so auto-sync pushes to us.
	// Failures must not block credential save (localhost / duplicate / Pluggy down).
	try {
		const { ensurePluggyWebhookRegistered } = await import(
			"../pluggy-webhook-config.js"
		);
		const registration = await ensurePluggyWebhookRegistered(input);
		if (!registration.registered && registration.error) {
			console.warn(
				"[pluggy] webhook auto-register skipped:",
				registration.error,
			);
		}
	} catch (error) {
		console.warn("[pluggy] webhook auto-register failed:", error);
	}

	return {
		configured: true,
		clientIdMasked: maskClientId(input.clientId),
	};
}

export async function deletePluggyCredentials(userId: string): Promise<void> {
	const row = await db
		.select({ clientId: pluggyCredentials.clientId })
		.from(pluggyCredentials)
		.where(eq(pluggyCredentials.userId, userId))
		.limit(1)
		.then((r) => r[0]);

	if (row) {
		clearPluggyApiKeyCache(row.clientId);
	}

	await db
		.delete(pluggyCredentials)
		.where(eq(pluggyCredentials.userId, userId));
}
