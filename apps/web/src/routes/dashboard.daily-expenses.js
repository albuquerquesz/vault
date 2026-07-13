import { jsx as _jsx } from "react/jsx-runtime";
import { createFileRoute } from "@tanstack/react-router";
import { dashboardDetailDefinitions } from "@/components/dashboard-detail-definitions";
import { DashboardDetailPage } from "@/components/dashboard-detail-page";
export const Route = createFileRoute("/dashboard/daily-expenses")({
    component: RouteComponent,
});
function RouteComponent() {
    return (_jsx(DashboardDetailPage, { detail: dashboardDetailDefinitions.dailyExpenses }));
}
