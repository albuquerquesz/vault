import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ExpensesPage } from "@/components/expenses-page";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/finance/expenses")({
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
			<ExpensesPage />
		</AppShell>
	);
}
