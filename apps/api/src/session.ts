import type { IncomingHttpHeaders } from "node:http";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth.js";
import type { Context } from "./context.js";
import {
	hasBearerToken,
	resolveMcpAccessToken,
} from "./services/mcp-tokens.js";

type RequireSessionOptions = {
	allowMcpToken?: boolean;
};

export async function requireSession(req: {
	headers: IncomingHttpHeaders;
}, options: RequireSessionOptions = {}): Promise<NonNullable<Context["session"]>> {
	if (options.allowMcpToken && hasBearerToken(req.headers)) {
		const mcpSession = await resolveMcpAccessToken(req.headers);
		if (!mcpSession) {
			throw Object.assign(new Error("Authentication required"), {
				statusCode: 401,
			});
		}
		return mcpSession;
	}

	const session = await auth.api.getSession({
		headers: fromNodeHeaders(req.headers),
	});

	if (!session) {
		throw Object.assign(new Error("Authentication required"), {
			statusCode: 401,
		});
	}

	return session;
}
