import { describe, expect, it } from "bun:test";
import { env } from "./db/env.js";
import { forwardAuthResponseHeaders } from "./lib/auth-response.js";
import { createApp } from "./hono/app.js";

describe("auth response forwarding", () => {
	it("forwards each Set-Cookie value independently", () => {
		const response = new Response("ok", {
			headers: {
				Location: "http://localhost:3001/",
				"X-Test": "preserved",
			},
		});
		response.headers.append("Set-Cookie", "better-auth.state=; Max-Age=0; Path=/");
		response.headers.append(
			"Set-Cookie",
			"better-auth.session_token=session; HttpOnly; Path=/",
		);

		const headers: Array<[string, string | string[]]> = [];
		const reply = {
			header(name: string, value: string | string[]) {
				headers.push([name, value]);
				return reply;
			},
		};

		forwardAuthResponseHeaders(response, reply);

		expect(headers).toContainEqual(["location", "http://localhost:3001/"]);
		expect(headers).toContainEqual(["x-test", "preserved"]);
		expect(headers).toContainEqual([
			"set-cookie",
			[
				"better-auth.state=; Max-Age=0; Path=/",
				"better-auth.session_token=session; HttpOnly; Path=/",
			],
		]);
	});
});

describe("OAuth callback failure", () => {
	it("redirects once to the frontend error route", async () => {
		const app = createApp();
		const response = await app.request(
			"/api/auth/callback/google?code=invalid&state=invalid",
		);

		expect(response.status).toBe(302);
		const errorBase = `${env.CORS_ORIGIN.replace(/\/$/, "")}/auth/error`;
		expect(response.headers.get("location")).toBe(
			`${errorBase}?error=please_restart_the_process`,
		);
	});
});
