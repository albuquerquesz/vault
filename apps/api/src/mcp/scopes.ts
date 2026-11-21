/**
 * OAuth scopes of the remote MCP. Reading needs `mcp:read`; each kind of write
 * has its own scope, so an assistant can be allowed to change goals without
 * being able to touch transactions.
 */
export const MCP_READ_SCOPE = "mcp:read" as const;

export const MCP_WRITE_SCOPES = [
	"mcp:transactions:write",
	"mcp:budgets:write",
	"mcp:goals:write",
	"mcp:categories:write",
	"mcp:bills:write",
] as const;

export const MCP_SCOPES = [MCP_READ_SCOPE, ...MCP_WRITE_SCOPES] as const;

export type McpScope = (typeof MCP_SCOPES)[number];

/** What the static `vlt_mcp_` key may do: read. */
export const READ_ONLY_SCOPES: ReadonlySet<McpScope> = new Set([MCP_READ_SCOPE]);

/** Everything; what a token issued before scopes existed keeps getting. */
export const ALL_MCP_SCOPES: ReadonlySet<McpScope> = new Set(MCP_SCOPES);

function isMcpScope(value: string): value is McpScope {
	return (MCP_SCOPES as readonly string[]).includes(value);
}

/** The `scope` claim of an access token is a space-separated string (RFC 9068). */
export function scopesFromClaim(claim: unknown): string[] {
	if (typeof claim === "string") return claim.split(/\s+/).filter(Boolean);
	if (Array.isArray(claim))
		return claim.filter((item): item is string => typeof item === "string");
	return [];
}

/**
 * The MCP scopes an access token grants.
 *
 * A token with no `mcp:*` scope predates this feature: it keeps today's full
 * access (`legacy: true`, so the caller can log it). Otherwise it gets exactly
 * the MCP scopes it carries, and any of them also allows reading, because a
 * write tool is useless without the ids the read tools return.
 */
export function resolveMcpScopes(claim: unknown): {
	scopes: ReadonlySet<McpScope>;
	legacy: boolean;
} {
	const granted = scopesFromClaim(claim).filter(isMcpScope);
	if (granted.length === 0) return { scopes: ALL_MCP_SCOPES, legacy: true };
	return { scopes: new Set([MCP_READ_SCOPE, ...granted]), legacy: false };
}
