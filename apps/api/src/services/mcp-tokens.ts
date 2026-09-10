import { createHash, randomBytes } from "node:crypto";
import type { IncomingHttpHeaders } from "node:http";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "../db/index.js";
import { mcpAccessToken, user } from "../db/schema/index.js";

const MCP_TOKEN_PREFIX = "vlt_mcp_";
const MCP_TOKEN_BYTES = 32;

export type McpUserSession = {
	user: {
		id: string;
		name: string;
		email: string;
	};
};

export type McpAccessTokenSummary = {
	id: string;
	name: string;
	tokenPrefix: string;
	createdAt: Date;
	lastUsedAt: Date | null;
	revokedAt: Date | null;
};

export function hashMcpToken(token: string) {
	return createHash("sha256").update(token).digest("hex");
}

export function extractBearerToken(headers: IncomingHttpHeaders) {
	const authorization = headers.authorization;
	if (typeof authorization !== "string") return null;

	const match = authorization.match(/^Bearer\s+(\S+)$/i);
	return match?.[1] ?? null;
}

export function hasBearerToken(headers: IncomingHttpHeaders) {
	return extractBearerToken(headers) !== null;
}

function createMcpTokenValue() {
	const token = `${MCP_TOKEN_PREFIX}${randomBytes(MCP_TOKEN_BYTES).toString("base64url")}`;
	return {
		token,
		tokenHash: hashMcpToken(token),
		tokenPrefix: token.slice(0, 16),
	};
}

export async function createMcpAccessToken(params: {
	userId: string;
	name: string;
}) {
	const generated = createMcpTokenValue();
	const [record] = await db
		.insert(mcpAccessToken)
		.values({
			userId: params.userId,
			name: params.name,
			tokenHash: generated.tokenHash,
			tokenPrefix: generated.tokenPrefix,
		})
		.returning({
			id: mcpAccessToken.id,
			name: mcpAccessToken.name,
			createdAt: mcpAccessToken.createdAt,
		});
	if (!record) throw new Error("Failed to create MCP access token");

	return {
		...record,
		token: generated.token,
		tokenPrefix: generated.tokenPrefix,
	};
}

export async function listMcpAccessTokens(userId: string) {
	return db
		.select({
			id: mcpAccessToken.id,
			name: mcpAccessToken.name,
			tokenPrefix: mcpAccessToken.tokenPrefix,
			createdAt: mcpAccessToken.createdAt,
			lastUsedAt: mcpAccessToken.lastUsedAt,
			revokedAt: mcpAccessToken.revokedAt,
		})
		.from(mcpAccessToken)
		.where(eq(mcpAccessToken.userId, userId))
		.orderBy(desc(mcpAccessToken.createdAt));
}

export async function revokeMcpAccessToken(params: {
	userId: string;
	tokenId: string;
}) {
	const [record] = await db
		.update(mcpAccessToken)
		.set({ revokedAt: new Date() })
		.where(
			and(
				eq(mcpAccessToken.id, params.tokenId),
				eq(mcpAccessToken.userId, params.userId),
				isNull(mcpAccessToken.revokedAt),
			),
		)
		.returning({ id: mcpAccessToken.id });

	return Boolean(record);
}

export async function resolveMcpAccessToken(
	headers: IncomingHttpHeaders,
): Promise<McpUserSession | null> {
	const token = extractBearerToken(headers);
	if (!token) return null;

	const [record] = await db
		.select({
			tokenId: mcpAccessToken.id,
			userId: user.id,
			name: user.name,
			email: user.email,
		})
		.from(mcpAccessToken)
		.innerJoin(user, eq(user.id, mcpAccessToken.userId))
		.where(
			and(
				eq(mcpAccessToken.tokenHash, hashMcpToken(token)),
				isNull(mcpAccessToken.revokedAt),
			),
		)
		.limit(1);

	if (!record) return null;

	await db
		.update(mcpAccessToken)
		.set({ lastUsedAt: new Date() })
		.where(eq(mcpAccessToken.id, record.tokenId));

	return {
		user: {
			id: record.userId,
			name: record.name,
			email: record.email,
		},
	};
}
