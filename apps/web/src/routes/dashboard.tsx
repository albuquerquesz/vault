import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Dashboard } from "@/components/dashboard";

export const Route = createFileRoute("/dashboard")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<AppShell>
			<div className="space-y-2">
				<h1 className="text-2xl font-semibold">Dashboard</h1>
				<p className="text-sm text-muted-foreground">Preview mode enabled.</p>
			</div>
			<Dashboard />
		</AppShell>
	);
}
