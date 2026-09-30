import { createFileRoute, redirect } from "@tanstack/react-router";
import { SettingsPage, type SettingsSection } from "@/components/settings-page";
import { authClient } from "@/lib/auth-client";
import { isDevAuthBypassEnabled } from "@/lib/dev-auth";

const SETTINGS_SECTIONS = ["general", "account", "about"] as const;

function isSettingsSection(value: unknown): value is SettingsSection {
	return (
		typeof value === "string" &&
		(SETTINGS_SECTIONS as readonly string[]).includes(value)
	);
}

export const Route = createFileRoute("/settings")({
	validateSearch: (
		search: Record<string, unknown>,
	): {
		section?: SettingsSection;
	} => {
		if (isSettingsSection(search.section)) {
			return { section: search.section };
		}
		return {};
	},
	beforeLoad: async () => {
		if (isDevAuthBypassEnabled()) return;

		const session = await authClient.getSession();
		if (!session?.data) {
			throw redirect({ to: "/login", replace: true });
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	return <SettingsPage />;
}
