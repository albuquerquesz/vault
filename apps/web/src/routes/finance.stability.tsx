import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { StabilityPage } from "@/components/stability-page";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/finance/stability")({
	component: RouteComponent,
	beforeLoad: async () => {
		const session = await authClient.getSession();
		if (!session.data) {
			redirect({
				to: "/login",
				throw: true,
			});
		}
		return { session };
	},
});

function RouteComponent() {
	return (
		<AppShell>
			<StabilityPage />
		</AppShell>
	);
}
