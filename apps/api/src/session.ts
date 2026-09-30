import { getAuth } from "./auth.js";
import type { Context } from "./context.js";
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
