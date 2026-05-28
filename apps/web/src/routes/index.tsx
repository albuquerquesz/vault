import { createFileRoute } from "@tanstack/react-router";

import { FinancialDashboard } from "@/components/financial-dashboard";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function HomeComponent() {
	return <FinancialDashboard />;
}
