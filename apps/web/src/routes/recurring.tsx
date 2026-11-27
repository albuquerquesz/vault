import { createFileRoute, redirect } from "@tanstack/react-router";
import { RecurringPage } from "@/components/recurring-page";
import { authClient } from "@/lib/auth-client";
import { isDevAuthBypassEnabled } from "@/lib/dev-auth";

export const Route = createFileRoute("/recurring")({
	beforeLoad: async () => {
		if (isDevAuthBypassEnabled()) return;

		const session = await authClient.getSession();
		if (!session?.data) {
			throw redirect({ to: "/login", replace: true });
		}
	},
	component: RecurringPage,
});
