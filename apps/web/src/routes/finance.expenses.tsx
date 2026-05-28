import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ExpensesPage } from "@/components/expenses-page";

export const Route = createFileRoute("/finance/expenses")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<AppShell>
			<ExpensesPage />
		</AppShell>
	);
}
