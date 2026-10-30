import { createMcpHandler } from "@modelcontextprotocol/server";
import { eq } from "drizzle-orm";
import type { Hono } from "hono";
import { createLocalJWKSet, type JSONWebKeySet, jwtVerify } from "jose";
import { AUTH_ISSUER, getAuth, MCP_RESOURCE } from "../auth.js";
import { db } from "../db/index.js";
import { user } from "../db/schema/index.js";
import { mcpRequestUser } from "../session.js";
import { createVaultMcpServer } from "./server.js";

const RESOURCE_METADATA_URL = `${new URL(MCP_RESOURCE).origin}/.well-known/oauth-protected-resource${new URL(MCP_RESOURCE).pathname}`;
const JWKS_TTL_MS = 5 * 60_000;

let jwksCache: {
	set: ReturnType<typeof createLocalJWKSet>;
	at: number;
} | null = null;

/** Signing keys come from the jwt() plugin in-process (no network round trip). */
async function getKeySet() {
	if (!jwksCache || Date.now() - jwksCache.at > JWKS_TTL_MS) {
		const jwks = (await getAuth().api.getJwks()) as JSONWebKeySet;
		jwksCache = { set: createLocalJWKSet(jwks), at: Date.now() };
	}
	return jwksCache.set;
}

/** RFC 9728 challenge so MCP clients start the OAuth flow. */
function unauthorized(message: string) {
	return new Response(
		JSON.stringify({
			jsonrpc: "2.0",
			error: { code: -32001, message },
			id: null,
		}),
		{
			status: 401,
			headers: {
				"content-type": "application/json",
				"www-authenticate": `Bearer resource_metadata="${RESOURCE_METADATA_URL}"`,
			},
		},
	);
}

async function authenticate(request: Request) {
	const match = request.headers
		.get("authorization")
		?.match(/^Bearer\s+(\S+)$/i);
	if (!match?.[1]) return null;
	try {
		const { payload } = await jwtVerify(match[1], await getKeySet(), {
			issuer: AUTH_ISSUER,
			audience: MCP_RESOURCE,
		});
		if (!payload.sub) return null;
		const [row] = await db
			.select({ id: user.id, name: user.name, email: user.email })
			.from(user)
			.where(eq(user.id, payload.sub))
			.limit(1);
		return row ?? null;
	} catch {
		// Keys may have rotated: refresh once on the next request.
		jwksCache = null;
		return null;
	}
}

/** Remote MCP endpoint (stateless Streamable HTTP) at /api/mcp. */
export function registerMcpRoute(app: Hono) {
	const handler = createMcpHandler(
		() =>
			createVaultMcpServer((method, path, body) =>
				Promise.resolve(
					app.fetch(
						new Request(new URL(path, MCP_RESOURCE), {
							method,
							headers: { "content-type": "application/json" },
							body: body === undefined ? undefined : JSON.stringify(body),
						}),
					),
				),
			),
		{ legacy: "stateless" },
	);

	app.all("/api/mcp", async (c) => {
		const currentUser = await authenticate(c.req.raw);
		if (!currentUser) {
			return unauthorized("Faça login no Vault para usar o MCP.");
		}
		return mcpRequestUser.run(currentUser, () => handler.fetch(c.req.raw));
	});
}
