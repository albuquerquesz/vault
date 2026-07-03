import { createFileRoute, redirect } from "@tanstack/react-router";
import { Dashboard } from "@/components/dashboard";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/dashboard-v2")({
	beforeLoad: async () => {
		const session = await authClient.getSession();
		if (!session?.data) {
			throw redirect({ to: "/login", replace: true });
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<main className="h-full w-full">
			<Dashboard />
		</main>
	);
}