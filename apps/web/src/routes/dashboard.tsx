import { createFileRoute } from "@tanstack/react-router";
import { FinancialDashboard } from "@/components/financial-dashboard";

export const Route = createFileRoute("/dashboard")({
	component: RouteComponent,
});

function RouteComponent() {
	return <FinancialDashboard />;
}
