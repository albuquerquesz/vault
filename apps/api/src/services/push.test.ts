import { describe, expect, test } from "bun:test";

process.env.DATABASE_URL ??= "postgres://postgres:password@localhost:5433/vault";
process.env.BETTER_AUTH_SECRET ??= "test-secret-that-is-at-least-32-characters";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
process.env.CORS_ORIGIN ??= "http://localhost:3001";
process.env.GOOGLE_CLIENT_ID ??= "test";
process.env.GOOGLE_CLIENT_SECRET ??= "test";

const { endpointHash, isExpiredPushError, validateSubscription } = await import("./push.js");

const valid = {
	endpoint: "https://fcm.googleapis.com/fcm/send/example",
	keys: { auth: "12345678abc", p256dh: "A".repeat(65) },
};

describe("push subscriptions", () => {
	test("accepts a supported HTTPS push destination", () => {
		expect(validateSubscription(valid)).toBe(true);
	});
	test("rejects untrusted and insecure destinations", () => {
		for (const endpoint of [
			"http://fcm.googleapis.com/fcm/send/example",
			"https://fcm.googleapis.com.evil.test/x",
			"https://127.0.0.1/x",
			"https://user@fcm.googleapis.com/x",
		]) expect(validateSubscription({ ...valid, endpoint })).toBe(false);
	});
	test("rejects malformed keys", () => {
		expect(validateSubscription({ ...valid, keys: { auth: "bad", p256dh: "A".repeat(65) } })).toBe(false);
	});
	test("uses a stable opaque endpoint identifier", () => {
		expect(endpointHash(valid.endpoint)).toHaveLength(64);
		expect(endpointHash(valid.endpoint)).not.toContain(valid.endpoint);
	});
	test("only permanent push responses revoke a subscription", () => {
		expect(isExpiredPushError({ statusCode: 404 })).toBe(true);
		expect(isExpiredPushError({ statusCode: 410 })).toBe(true);
		expect(isExpiredPushError({ statusCode: 503 })).toBe(false);
	});
});
