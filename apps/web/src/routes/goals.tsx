import { createFileRoute, redirect } from "@tanstack/react-router";
import { GoalsPage } from "@/components/goals-page";
import { authClient } from "@/lib/auth-client";
import { isDevAuthBypassEnabled } from "@/lib/dev-auth";

export const Route = createFileRoute("/goals")({
	beforeLoad: async () => {
		if (isDevAuthBypassEnabled()) return;

		const session = await authClient.getSession();
		if (!session?.data) {
			throw redirect({ to: "/login", replace: true });
		}
	},
	component: GoalsPage,
});
