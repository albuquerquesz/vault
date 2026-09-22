import "./load-env.js";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	clientPrefix: "",
	client: {},
	server: {
		DATABASE_URL: z.string().min(1),
		POSTGRES_DB: z.string().min(1).default("vault"),
		POSTGRES_HOST: z.string().min(1).default("localhost"),
		POSTGRES_PASSWORD: z.string().min(1).default("password"),
		POSTGRES_PORT: z.coerce.number().int().positive().default(5433),
		POSTGRES_USER: z.string().min(1).default("postgres"),
		BETTER_AUTH_SECRET: z.string().min(32),
		BETTER_AUTH_URL: z.url(),
		CORS_ORIGIN: z.url(),
		GOOGLE_CLIENT_ID: z.string().min(1),
		GOOGLE_CLIENT_SECRET: z.string().min(1),
		/** Optional 32-byte key (base64). Falls back to a hash of BETTER_AUTH_SECRET. */
		CREDENTIALS_ENCRYPTION_KEY: z.string().min(1).optional(),
		VAPID_PUBLIC_KEY: z.string().min(1).optional(),
		VAPID_PRIVATE_KEY: z.string().min(1).optional(),
		VAPID_SUBJECT: z.string().min(1).optional(),
		/**
		 * Public HTTPS URL for Pluggy webhooks.
		 * Defaults to `${BETTER_AUTH_URL}/api/webhooks/pluggy`.
		 */
		PLUGGY_WEBHOOK_URL: z.url().optional(),
		/**
		 * Shared secret sent as `X-Vault-Webhook-Secret` when registering
		 * webhooks via API and validated on receive when set.
		 */
		PLUGGY_WEBHOOK_SECRET: z.string().min(8).optional(),
		NOTIFIQUE_API_KEY: z.string().min(1).optional(),
		NOTIFIQUE_BASE_URL: z.url().default("https://api.notifique.dev"),
		NOTIFIQUE_FROM_EMAIL: z.string().min(1).optional(),
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
