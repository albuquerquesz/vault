import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { env } from "./db/env.js";
import { createDb } from "./db/index.js";
import * as schema from "./db/schema/auth.js";

const frontAuthErrorUrl = `${env.CORS_ORIGIN.replace(/\/$/, "")}/auth/error`;
const authBaseUrlFallback = env.BETTER_AUTH_URL.replace(/\/$/, "");

export function createAuth() {
	const db = createDb();

	return betterAuth({
		database: drizzleAdapter(db, {
			provider: "pg",
			schema,
		}),
		trustedOrigins: [env.CORS_ORIGIN],
		emailAndPassword: {
			enabled: true,
		},
		secret: env.BETTER_AUTH_SECRET,
		baseURL: {
			allowedHosts: [
				"vault-web-six.vercel.app",
				"vault-api-phi.vercel.app",
				"localhost:3000",
				"localhost:3001",
			],
			fallback: authBaseUrlFallback,
			protocol: "https",
		},
		socialProviders: {
			google: {
				clientId: env.GOOGLE_CLIENT_ID,
				clientSecret: env.GOOGLE_CLIENT_SECRET,
			},
		},
		advanced: {
			defaultCookieAttributes: {
				sameSite: "none",
				secure: true,
				httpOnly: true,
			},
			trustedProxyHeaders: true,
		},
		onAPIError: {
			errorURL: frontAuthErrorUrl,
		},
		plugins: [],
	});
}

export const auth = createAuth();
