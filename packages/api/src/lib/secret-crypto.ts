import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { env } from "../db/env";

const ALGO = "aes-256-gcm";

function getEncryptionKey(): Buffer {
	if (env.CREDENTIALS_ENCRYPTION_KEY) {
		const key = Buffer.from(env.CREDENTIALS_ENCRYPTION_KEY, "base64");
		if (key.length !== 32) {
			throw new Error(
				"CREDENTIALS_ENCRYPTION_KEY must be 32 bytes encoded as base64",
			);
		}
		return key;
	}

	// Derive a stable 32-byte key from BETTER_AUTH_SECRET when no dedicated key is set.
	return createHash("sha256").update(env.BETTER_AUTH_SECRET).digest();
}

/** Encrypt plaintext → `iv.tag.ciphertext` (each part base64). */
export function encryptSecret(plaintext: string): string {
	const key = getEncryptionKey();
	const iv = randomBytes(12);
	const cipher = createCipheriv(ALGO, key, iv);
	const encrypted = Buffer.concat([
		cipher.update(plaintext, "utf8"),
		cipher.final(),
	]);
	const tag = cipher.getAuthTag();
	return [
		iv.toString("base64"),
		tag.toString("base64"),
		encrypted.toString("base64"),
	].join(".");
}

/** Decrypt `iv.tag.ciphertext` produced by encryptSecret. */
export function decryptSecret(payload: string): string {
	const parts = payload.split(".");
	if (parts.length !== 3) {
		throw new Error("Invalid encrypted secret format");
	}

	const [ivB64, tagB64, dataB64] = parts as [string, string, string];
	const key = getEncryptionKey();
	const iv = Buffer.from(ivB64, "base64");
	const tag = Buffer.from(tagB64, "base64");
	const data = Buffer.from(dataB64, "base64");

	const decipher = createDecipheriv(ALGO, key, iv);
	decipher.setAuthTag(tag);
	const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
	return decrypted.toString("utf8");
}

export function maskClientId(clientId: string): string {
	if (clientId.length <= 8) return "••••";
	return `${clientId.slice(0, 4)}…${clientId.slice(-4)}`;
}
