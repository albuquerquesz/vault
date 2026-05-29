import { createFileRoute } from "@tanstack/react-router";
import { StabilityPage } from "@/components/stability-page";

export const Route = createFileRoute("/finance/stability")({
	component: RouteComponent,
});

function RouteComponent() {
	return <StabilityPage />;
}
