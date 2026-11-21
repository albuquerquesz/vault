import { describe, expect, test } from "bun:test";
import {
	ALL_MCP_SCOPES,
	MCP_SCOPES,
	READ_ONLY_SCOPES,
	resolveMcpScopes,
	scopesFromClaim,
} from "./scopes.js";

describe("scopesFromClaim", () => {
	test("reads the space-separated string and tolerates arrays and junk", () => {
		expect(scopesFromClaim("openid  mcp:read")).toEqual(["openid", "mcp:read"]);
		expect(scopesFromClaim(["openid", 1, "mcp:read"])).toEqual(["openid", "mcp:read"]);
		expect(scopesFromClaim(undefined)).toEqual([]);
		expect(scopesFromClaim(42)).toEqual([]);
	});
});

describe("resolveMcpScopes", () => {
	test("a token without any mcp scope is legacy and keeps full access", () => {
		const result = resolveMcpScopes("openid profile email offline_access");
		expect(result.legacy).toBe(true);
		expect(result.scopes).toEqual(ALL_MCP_SCOPES);
	});

	test("a missing claim is legacy too", () => {
		expect(resolveMcpScopes(undefined).legacy).toBe(true);
	});

	test("only the mcp scopes carried are granted, and reading comes with them", () => {
		const result = resolveMcpScopes("openid mcp:goals:write");
		expect(result.legacy).toBe(false);
		expect([...result.scopes].sort()).toEqual(["mcp:goals:write", "mcp:read"]);
	});

	test("mcp:read alone grants read only", () => {
		const result = resolveMcpScopes("openid mcp:read");
		expect(result.scopes).toEqual(READ_ONLY_SCOPES);
	});

	test("unknown mcp scopes are ignored", () => {
		const result = resolveMcpScopes("mcp:read mcp:payments:write");
		expect(result.legacy).toBe(false);
		expect(result.scopes).toEqual(READ_ONLY_SCOPES);
	});

	test("the list has one read scope and the write scopes", () => {
		expect(MCP_SCOPES[0]).toBe("mcp:read");
		expect(MCP_SCOPES.every((scope) => scope.startsWith("mcp:"))).toBe(true);
	});
});
