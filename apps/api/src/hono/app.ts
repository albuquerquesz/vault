import { Hono } from "hono";
import { cors } from "hono/cors";
import { getAuth } from "../auth.js";
import { env } from "../db/env.js";
import { buildFrontAuthErrorUrl } from "../lib/auth-redirect.js";
import { toAuthResponse } from "../lib/auth-response.js";
import { registerRoutes } from "../routers/index.js";

export function createApp() {
	const app = new Hono();

	app.use(
		"*",
		cors({
			origin: env.CORS_ORIGIN,
			allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
			allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
			credentials: true,
			maxAge: 86400,
		}),
	);

	app.on(["GET", "POST"], "/api/auth/*", async (c) => {
		try {
			const response = await getAuth().handler(c.req.raw);
			return toAuthResponse(response);
		} catch (error) {
			console.error("Authentication Error:", error);
			return c.json(
				{
					error: "Internal authentication error",
					code: "AUTH_FAILURE",
				},
				500,
			);
		}
	});

	// OAuth discovery for MCP clients, served by the better-auth OAuth provider:
	// RFC 8414 authorization-server metadata (issuer path inserted) and RFC 9728
	// protected-resource metadata for /api/mcp.
	app.on(["GET", "HEAD"], "/.well-known/*", async (c) => {
		return toAuthResponse(await getAuth().handler(c.req.raw));
	});

	registerRoutes(app);

	app.get("/", (c) => {
		const query = c.req.query();
		if (query.error || query.state) {
			return c.redirect(buildFrontAuthErrorUrl(query));
		}
		return c.text("OK");
	});

	app.get("/error", (c) => {
		return c.redirect(buildFrontAuthErrorUrl(c.req.query()));
	});

	return app;
}

export const app = createApp();
