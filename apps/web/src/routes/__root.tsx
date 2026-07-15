import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	useRouterState,
} from "@tanstack/react-router";
import { Toaster } from "@vault/ui/components/sonner";
import { TooltipProvider } from "@vault/ui/components/tooltip";
import { AppShell } from "@/components/app-shell";
import { ThemeProvider } from "@/components/theme-provider";

import "../index.css";

export interface RouterAppContext {
	queryClient: import("@tanstack/react-query").QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
	component: RootComponent,
	head: () => ({
		meta: [
			{
				title: "vault",
			},
			{
				name: "description",
				content: "vault is a web application",
			},
		],
		links: [
			{
				rel: "icon",
				href: "/favicon.ico",
			},
		],
	}),
});

function RootComponent() {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const isStandaloneAuthPage =
		pathname === "/login" || pathname === "/auth/error";
	const forcedTheme = isStandaloneAuthPage ? "dark" : undefined;

	return (
		<>
			<HeadContent />
			<ThemeProvider
				attribute="class"
				defaultTheme="dark"
				disableTransitionOnChange
				forcedTheme={forcedTheme}
				storageKey="vite-ui-theme"
			>
				<TooltipProvider delay={800}>
					{isStandaloneAuthPage ? (
						<div className="grid h-svh grid-rows-[auto_1fr]">
							<Outlet />
						</div>
					) : (
						<AppShell>
							<Outlet />
						</AppShell>
					)}
					<Toaster richColors />
				</TooltipProvider>
			</ThemeProvider>
		</>
	);
}
