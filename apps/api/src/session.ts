import { getAuth } from "./auth.js";
import type { Context } from "./context.js";
import { env } from "./db/env.js";
import {
	hasBearerToken,
	resolveMcpAccessToken,
} from "./services/mcp-tokens.js";

type RequireSessionOptions = {
	allowMcpToken?: boolean;
};

export async function requireSession(
	req: { headers: Headers },
	options: RequireSessionOptions = {},
): Promise<NonNullable<Context["session"]>> {
	const apiHost = new URL(env.BETTER_AUTH_URL).hostname;
	const webHost = new URL(env.CORS_ORIGIN).hostname;
	const isLocalDevelopment =
		env.NODE_ENV === "development" &&
		["localhost", "127.0.0.1"].includes(apiHost) &&
		["localhost", "127.0.0.1"].includes(webHost);
	if (
		isLocalDevelopment &&
		req.headers.get("x-vault-dev-auth-bypass") === "1"
	) {
		return {
			user: {
				id: "user_seed_rich",
				name: "Camila Demo",
				email: "camila@vault.local",
			},
		};
	}

	if (options.allowMcpToken && hasBearerToken(req.headers)) {
		const mcpSession = await resolveMcpAccessToken(req.headers);
		if (!mcpSession) {
			throw Object.assign(new Error("Authentication required"), {
				statusCode: 401,
			});
		}
		return mcpSession;
	}

	const session = await getAuth().api.getSession({
		headers: req.headers,
	});

	if (!session) {
		throw Object.assign(new Error("Authentication required"), {
			statusCode: 401,
		});
	}

	return session;
}
