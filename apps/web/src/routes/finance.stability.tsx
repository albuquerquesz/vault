import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { StabilityPage } from "@/components/stability-page";

export const Route = createFileRoute("/finance/stability")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<AppShell>
			<StabilityPage />
		</AppShell>
	);
}
