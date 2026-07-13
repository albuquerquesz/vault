import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/pluggy")({
    beforeLoad: () => {
        throw redirect({ to: "/settings", search: { section: "general" } });
    },
});
