import { sql } from "drizzle-orm";
import { app } from "../src/hono/app.js";
import { db } from "../src/db/index.js";
import { user } from "../src/db/schema/index.js";

/** The user the dev login bypass signs in as (see `requireSession`). */
export const TEST_USER_ID = "user_seed_rich";

export type ApiResult<T = any> = { status: number; json: T; text: string };

/** Calls a finance route of the real app, signed in as the test user. */
export async function api<T = any>(
	method: string,
	path: string,
	body?: unknown,
): Promise<ApiResult<T>> {
	const response = await app.fetch(
		new Request(`http://localhost:3000/api/finance${path}`, {
			method,
			headers: {
				"content-type": "application/json",
				"x-vault-dev-auth-bypass": "1",
			},
			body: body === undefined ? undefined : JSON.stringify(body),
		}),
	);
	const text = await response.text();
	let json: unknown = null;
	try {
		json = JSON.parse(text);
	} catch {}
	return { status: response.status, json: json as T, text };
}

/** Empties everything (the user cascades to its data) and recreates the test user. */
export async function resetDatabase() {
	await db.execute(sql`TRUNCATE TABLE "user" CASCADE`);
	await db.insert(user).values({
		id: TEST_USER_ID,
		name: "Teste de integração",
		email: "integracao@vault.local",
	});
}
