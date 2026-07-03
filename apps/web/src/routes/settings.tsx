import { createFileRoute, redirect } from "@tanstack/react-router";
import { SettingsPage } from "@/components/settings-page";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/settings")({
	beforeLoad: async () => {
		const session = await authClient.getSession();
		if (!session?.data) {
			throw redirect({ to: "/login", replace: true });
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	return <SettingsPage />;
}
