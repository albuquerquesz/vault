import { auth } from "./auth.js";
import { db } from "./db/index.js";

export interface Context {
	auth: typeof auth;
	db: typeof db;
	session: { user: { id: string; name: string; email: string } } | null;
}

export async function createContext(): Promise<Context> {
	return {
		auth,
		db,
		session: null,
	};
}
