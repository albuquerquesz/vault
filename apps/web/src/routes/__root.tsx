import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Toaster } from "@vault/ui/components/sonner";

import { ThemeProvider } from "@/components/theme-provider";
import type { trpc } from "@/utils/trpc";

import "../index.css";

export interface RouterAppContext {
	trpc: typeof trpc;
	queryClient: QueryClient;
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
	const forcedTheme = pathname === "/login" ? "dark" : undefined;

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
				<div className="grid h-svh grid-rows-[auto_1fr]">
					<Outlet />
				</div>
				<Toaster richColors />
			</ThemeProvider>
			<TanStackRouterDevtools position="top-right" />
			<ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
		</>
	);
}
