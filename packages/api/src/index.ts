import type { IncomingHttpHeaders } from "node:http";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth";
import type { Context } from "./context";

export async function requireSession(req: {
	headers: IncomingHttpHeaders;
}): Promise<NonNullable<Context["session"]>> {
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
