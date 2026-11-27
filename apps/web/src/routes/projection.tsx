import { createFileRoute, redirect } from "@tanstack/react-router";
import { ProjectionPage } from "@/components/projection-page";
import { authClient } from "@/lib/auth-client";
import { isDevAuthBypassEnabled } from "@/lib/dev-auth";

export const Route = createFileRoute("/projection")({
	beforeLoad: async () => {
		if (isDevAuthBypassEnabled()) return;

		const session = await authClient.getSession();
		if (!session?.data) {
			throw redirect({ to: "/login", replace: true });
		}
	},
	component: ProjectionPage,
});
