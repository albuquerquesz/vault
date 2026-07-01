import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth";
import { db } from "./db";

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
