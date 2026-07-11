import { eq } from "drizzle-orm";
import {
	authenticatePluggy,
	clearPluggyApiKeyCache,
	createPluggyClient,
	type PluggyClient,
} from "../../clients/pluggy";
import type { PluggyCredentials } from "../../clients/pluggy/types";
import { db } from "../../db";
import { env } from "../../db/env";
import { pluggyCredentials } from "../../db/schema";
import {
	decryptSecret,
	encryptSecret,
	maskClientId,
} from "../../lib/secret-crypto";

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
	source: "user" | "platform" | null;
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
			source: "user",
			clientIdMasked: maskClientId(row.clientId),
		};
	}

	if (env.PLUGGY_CLIENT_ID && env.PLUGGY_CLIENT_SECRET) {
		return {
			configured: true,
			source: "platform",
			clientIdMasked: maskClientId(env.PLUGGY_CLIENT_ID),
		};
	}

	return {
		configured: false,
		source: null,
		clientIdMasked: null,
	};
}

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

	if (env.PLUGGY_CLIENT_ID && env.PLUGGY_CLIENT_SECRET) {
		return {
			clientId: env.PLUGGY_CLIENT_ID,
			clientSecret: env.PLUGGY_CLIENT_SECRET,
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

	return {
		configured: true,
		source: "user",
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
