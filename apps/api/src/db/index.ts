import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "./env.js";
import * as schema from "./schema/index.js";

export function createDb() {
	return drizzle(env.DATABASE_URL, { schema });
}

export const db = createDb();
