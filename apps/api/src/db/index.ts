import { AsyncLocalStorage } from "node:async_hooks";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeonHttp } from "drizzle-orm/neon-http";
import {
	drizzle as drizzleNodePg,
	type NodePgDatabase,
} from "drizzle-orm/node-postgres";
import { Client } from "pg";
import { env } from "./env.js";
import * as schema from "./schema/index.js";

export type Database = NodePgDatabase<typeof schema>;

const databaseHost = new URL(env.DATABASE_URL).hostname;
const usesLocalPostgres = ["localhost", "127.0.0.1"].includes(databaseHost);

// Used outside a request scope (tests, scripts, local Node server).
const fallbackDb: Database = usesLocalPostgres
	? await import("./local-db.js").then(({ createLocalDb }) =>
			createLocalDb(env.DATABASE_URL),
		)
	: (drizzleNeonHttp({
			client: neon(env.DATABASE_URL),
			schema,
		}) as unknown as Database);

const requestDb = new AsyncLocalStorage<Database>();

/**
 * Runs `fn` with a single Postgres connection shared by every query in it.
 * On Workers this goes through Hyperdrive: one TCP socket per invocation instead
 * of one HTTP subrequest per query (Workers Free caps subrequests at 50).
 */
export async function withRequestDb<T>(
	connectionString: string,
	fn: () => Promise<T>,
	waitUntil?: (promise: Promise<unknown>) => void,
): Promise<T> {
	const client = new Client({ connectionString });
	await client.connect();
	try {
		return await requestDb.run(drizzleNodePg(client, { schema }), fn);
	} finally {
		const ending = client.end().catch(() => {});
		if (waitUntil) waitUntil(ending);
		else await ending;
	}
}

/** Request-scoped connection when inside `withRequestDb`, otherwise the fallback. */
export const db: Database = new Proxy(fallbackDb, {
	get(_target, prop) {
		const target = requestDb.getStore() ?? fallbackDb;
		const value = Reflect.get(target, prop, target);
		return typeof value === "function" ? value.bind(target) : value;
	},
});

export function createDb() {
	return db;
}
