import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { env } from "./db/env.js";
import { createDb } from "./db/index.js";
import * as schema from "./db/schema/auth.js";
import { sendPasswordResetEmail } from "./services/notifique.js";

const frontAuthErrorUrl = `${env.CORS_ORIGIN.replace(/\/$/, "")}/auth/error`;
const authBaseUrlFallback = env.BETTER_AUTH_URL.replace(/\/$/, "");
const authBaseUrlProtocol = new URL(env.BETTER_AUTH_URL).protocol.replace(
	/:$/,
	"",
) as "http" | "https";

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
			sendResetPassword: async ({ user, url }) => {
				await sendPasswordResetEmail({ to: user.email, url });
			},
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
			protocol: authBaseUrlProtocol,
		},
		socialProviders: {
			google: {
				clientId: env.GOOGLE_CLIENT_ID,
				clientSecret: env.GOOGLE_CLIENT_SECRET,
			},
		},
		advanced: {
			trustedProxyHeaders: true,
		},
		onAPIError: {
			errorURL: frontAuthErrorUrl,
		},
		plugins: [],
	});
}

export const auth = createAuth();
