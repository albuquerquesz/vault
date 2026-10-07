import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "./env.js";
import * as schema from "./schema/index.js";

const databaseHost = new URL(env.DATABASE_URL).hostname;
const usesLocalPostgres = ["localhost", "127.0.0.1"].includes(databaseHost);
const neonDb = drizzle({ client: neon(env.DATABASE_URL), schema });

export const db = usesLocalPostgres
	? await import("./local-db.js").then(({ createLocalDb }) =>
			createLocalDb(env.DATABASE_URL) as unknown as typeof neonDb,
		)
	: neonDb;

export function createDb() {
	return db;
}
