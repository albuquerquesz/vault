import {
	type EmailSendResponse,
	Notifique,
	NotifiqueApiError,
} from "@notifique/sdk-node";
import { env } from "../db/env.js";

export class NotifiqueError extends Error {
	readonly status: number;
	readonly code?: string;

	constructor(status: number, message: string, code?: string) {
		super(message);
		this.name = "NotifiqueError";
		this.status = status;
		this.code = code;
	}
}

export type NotifiqueClient = Notifique;

let client: Notifique | undefined;
let clientKey = "";

export function getNotifiqueClient(): Notifique {
	const apiKey = env.NOTIFIQUE_API_KEY?.trim();
	if (!apiKey) {
		throw new NotifiqueError(401, "NOTIFIQUE_API_KEY is not set.");
	}
	const baseUrl = env.NOTIFIQUE_BASE_URL.replace(/\/$/, "");
	const nextKey = `${apiKey}|${baseUrl}`;
	if (!client || clientKey !== nextKey) {
		client = new Notifique({ apiKey, baseUrl });
		clientKey = nextKey;
	}
	return client;
}

export function resetNotifiqueClient(): void {
	client = undefined;
	clientKey = "";
}

export async function sendPasswordResetEmail(input: {
	to: string;
	url: string;
	from?: string;
	client?: NotifiqueClient;
}): Promise<EmailSendResponse> {
	const from = input.from?.trim() ?? env.NOTIFIQUE_FROM_EMAIL?.trim();
	if (!from) {
		throw new NotifiqueError(500, "NOTIFIQUE_FROM_EMAIL is not set.");
	}

	try {
		return await (input.client ?? getNotifiqueClient()).email.send(
			{
				from,
				to: [input.to],
				subject: "Reset your Vault password",
				text: `Reset your password using this link: ${input.url}`,
				html: `<p>Reset your password using this link:</p><p><a href="${input.url}">Reset password</a></p>`,
			},
			{ idempotencyKey: `vault:password-reset:${input.to}:${input.url}` },
		);
	} catch (error) {
		if (error instanceof NotifiqueError) throw error;
		if (error instanceof NotifiqueApiError) {
			throw new NotifiqueError(error.statusCode, error.message, error.code);
		}
		throw error;
	}
}
