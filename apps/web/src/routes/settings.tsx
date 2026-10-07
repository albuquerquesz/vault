import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@vault/ui/components/sheet";
import { Button } from "@vault/ui/components/button";
import { XIcon } from "lucide-react";
import { FinancialDashboard } from "@/components/financial-dashboard";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { SettingsPage, type SettingsSection } from "@/components/settings-page";
import { authClient } from "@/lib/auth-client";
import { isDevAuthBypassEnabled } from "@/lib/dev-auth";

const SETTINGS_SECTIONS = ["general", "account", "about", "mcp"] as const;

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
	const navigate = useNavigate();
	return (
		<>
			<FinancialDashboard />
			<Sheet
				open
				onOpenChange={(open) => {
					if (!open) void navigate({ to: "/", replace: true });
				}}
			>
				<SheetContent
					showCloseButton={false}
					className="rounded-[18px] overflow-hidden data-[side=right]:inset-y-4 data-[side=right]:right-4 data-[side=right]:h-[calc(100dvh-32px)] data-[side=right]:w-[calc(100%-32px)] data-[side=right]:sm:max-w-[600px]"
				>
					<SheetHeader className="shrink-0 gap-1 p-4 pr-14 sm:p-6 sm:pr-14">
						<SheetTitle
							className="text-2xl font-semibold tracking-tight"
							style={{ fontFamily: '"Space Grotesk", sans-serif' }}
						>
							Configurações
						</SheetTitle>
						<SheetDescription className="sr-only">
							Ajustes da conta, preferências e integrações.
						</SheetDescription>
					</SheetHeader>
					<SheetClose
						render={
							<Button
								variant="ghost"
								size="icon-sm"
								className="absolute right-4 top-4"
							/>
						}
						aria-label="Fechar configurações"
					>
						<XIcon />
					</SheetClose>
					<div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-4 pb-6 sm:px-6">
						<SettingsPage />
					</div>
				</SheetContent>
			</Sheet>
		</>
	);
}
