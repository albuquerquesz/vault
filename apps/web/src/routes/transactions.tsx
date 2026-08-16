import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/transactions")({
	component: RouteComponent,
});

function RouteComponent() {
	return <Outlet />;
}
