import { protectedProcedure, publicProcedure, router } from "../index";
import { financeRouter } from "./finance";
import { pluggyRouter } from "./pluggy";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	finance: financeRouter,
	pluggy: pluggyRouter,
	privateData: protectedProcedure.query(({ ctx }) => {
		return {
			message: "This is private",
			user: ctx.session.user,
		};
	}),
});
export type AppRouter = typeof appRouter;
