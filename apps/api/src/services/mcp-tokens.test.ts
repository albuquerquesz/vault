import { describe, expect, test } from "bun:test";
import {
	extractBearerToken,
	hasBearerToken,
	hashMcpToken,
} from "./mcp-tokens.js";

describe("MCP token helpers", () => {
	test("hashes the complete token deterministically", () => {
		expect(hashMcpToken("vlt_mcp_test-token")).toBe(
			"0947ee3162de454bc7970fb3426dc902d29dfbfbb283c4028364f8f279edc469",
		);
	});

	test("extracts bearer tokens case-insensitively", () => {
		expect(extractBearerToken({ authorization: "bearer vlt_mcp_secret" })).toBe(
			"vlt_mcp_secret",
		);
		expect(hasBearerToken({ authorization: "Bearer vlt_mcp_secret" })).toBe(
			true,
		);
	});

	test("does not treat other authorization schemes as MCP tokens", () => {
		expect(extractBearerToken({ authorization: "Basic abc" })).toBeNull();
		expect(hasBearerToken({ authorization: "Bearer" })).toBe(false);
		expect(extractBearerToken({})).toBeNull();
	});
});
