import { createFileRoute, redirect } from "@tanstack/react-router";
import { InvestmentsPage } from "@/components/investments-page";
import { authClient } from "@/lib/auth-client";
import { isDevAuthBypassEnabled } from "@/lib/dev-auth";

export const Route = createFileRoute("/investments")({
	beforeLoad: async () => {
		if (isDevAuthBypassEnabled()) return;

		const session = await authClient.getSession();
		if (!session?.data) {
			throw redirect({ to: "/login", replace: true });
		}
	},
	component: InvestmentsPage,
});
