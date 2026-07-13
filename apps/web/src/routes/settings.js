import { jsx as _jsx } from "react/jsx-runtime";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { SettingsPage } from "@/components/settings-page";
import { authClient } from "@/lib/auth-client";
const SETTINGS_SECTIONS = ["general", "account", "about"];
function isSettingsSection(value) {
    return (typeof value === "string" &&
        SETTINGS_SECTIONS.includes(value));
}
export const Route = createFileRoute("/settings")({
    validateSearch: (search) => {
        if (isSettingsSection(search.section)) {
            return { section: search.section };
        }
        return {};
    },
    beforeLoad: async () => {
        const session = await authClient.getSession();
        if (!session?.data) {
            throw redirect({ to: "/login", replace: true });
        }
    },
    component: RouteComponent,
});
function RouteComponent() {
    return _jsx(SettingsPage, {});
}
