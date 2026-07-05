import { createFileRoute } from "@tanstack/react-router";
import { PluggyPage } from "@/components/pluggy-page";

export const Route = createFileRoute("/pluggy")({
	component: RouteComponent,
});

function RouteComponent() {
	return <PluggyPage />;
}
