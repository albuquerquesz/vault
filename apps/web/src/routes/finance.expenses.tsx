import { createFileRoute } from "@tanstack/react-router";
import { ExpensesPage } from "@/components/expenses-page";

export const Route = createFileRoute("/finance/expenses")({
	component: RouteComponent,
});

function RouteComponent() {
	return <ExpensesPage />;
}
