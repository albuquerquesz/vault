import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "./env.js";
import * as schema from "./schema/index.js";

export function createDb() {
	const sql = neon(env.DATABASE_URL);
	return drizzle({ client: sql, schema });
}

export const db = createDb();
