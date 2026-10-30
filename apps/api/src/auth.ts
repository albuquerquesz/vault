import { mcp } from "@better-auth/mcp";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { jwt } from "better-auth/plugins";
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

/** OAuth issuer for MCP clients; fixed so tokens don't depend on the request host. */
export const AUTH_ISSUER = `${authBaseUrlFallback}/api/auth`;
/** Canonical remote MCP endpoint; issued access tokens are audience-bound to it. */
export const MCP_RESOURCE = `${authBaseUrlFallback}/api/mcp`;

function createAuth() {
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
				"vault.albuquerquesz.com",
				"vault-api.albuquerquesz.com",
				"vault-web.pages.dev",
				"vault-web-1ze.pages.dev",
				"vault-web-six.vercel.app",
				"vault-api-phi.vercel.app",
				"vault-api.albqvictor.workers.dev",
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
		plugins: [
			jwt({ jwt: { issuer: AUTH_ISSUER } }),
			// OAuth 2.1 provider for remote MCP clients (Claude, ChatGPT, Cursor…).
			// Clients self-register (RFC 7591); CIMD needs a DNS-pinning fetcher
			// that Workers can't provide yet.
			mcp({
				resource: MCP_RESOURCE,
				loginPage: "/login",
				consentPage: "/oauth/consent",
				scopes: ["openid", "profile", "email", "offline_access"],
				allowDynamicClientRegistration: true,
				allowUnauthenticatedClientRegistration: true,
			}),
		],
	});
}

/**
 * The parts of the auth instance the app uses. Exported instead of the inferred
 * better-auth type, which references OAuth provider internals that TypeScript
 * can't name from this package (composite declaration emit).
 */
export type VaultAuth = {
	handler: (request: Request) => Promise<Response>;
	api: {
		getSession: (params: {
			headers: Headers;
		}) => Promise<{ user: { id: string; name: string; email: string } } | null>;
		/** Public signing keys used to verify MCP access tokens in-process. */
		getJwks: (params?: Record<string, never>) => Promise<{ keys: object[] }>;
	};
};

let authSingleton: ReturnType<typeof createAuth> | undefined;

export function getAuth(): VaultAuth {
	if (!authSingleton) {
		authSingleton = createAuth();
	}
	return authSingleton;
}

/** @deprecated use getAuth() */
export const auth: VaultAuth = getAuth();
