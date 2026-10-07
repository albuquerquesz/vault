import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema/index.js";

export function createLocalDb(connectionString: string) {
	return drizzle(new Pool({ connectionString }), { schema });
}
