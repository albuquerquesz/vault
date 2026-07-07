import { auth } from "./auth";
import { db } from "./db";

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
