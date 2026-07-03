import { createFileRoute } from "@tanstack/react-router";
import { dashboardDetailDefinitions } from "@/components/dashboard-detail-definitions";
import { DashboardDetailPage } from "@/components/dashboard-detail-page";

export const Route = createFileRoute("/dashboard/daily-expenses")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<DashboardDetailPage detail={dashboardDetailDefinitions.dailyExpenses} />
	);
}
