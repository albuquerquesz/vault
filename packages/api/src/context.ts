import { db } from "@vault/db";
import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import { auth } from "@vault/auth";
import { fromNodeHeaders } from "better-auth/node";

export async function createContext({ req }: CreateFastifyContextOptions) {
	const session = await auth.api.getSession({
		headers: fromNodeHeaders(req.headers),
	});
	return {
		auth,
		db,
		session,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
