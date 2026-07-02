import { createFileRoute, redirect } from "@tanstack/react-router";
import { FinancialDashboard } from "@/components/financial-dashboard";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/")({
	beforeLoad: async () => {
		const session = await authClient.getSession();
		if (!session?.data) {
			throw redirect({ to: "/login", replace: true });
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	return <FinancialDashboard />;
}
