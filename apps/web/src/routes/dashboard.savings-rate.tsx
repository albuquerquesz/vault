import { createFileRoute } from "@tanstack/react-router";
import { DashboardDetailPage } from "@/components/dashboard-detail-page";
import { dashboardDetailDefinitions } from "@/components/dashboard-detail-definitions";

export const Route = createFileRoute("/dashboard/savings-rate")({
	component: RouteComponent,
});

function RouteComponent() {
	return <DashboardDetailPage detail={dashboardDetailDefinitions.savingsRate} />;
}
