import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import type { AppRouter } from "@vault/api/routers/index";
import { toast } from "sonner";
import { env } from "@/common/env";

export const queryClient = new QueryClient({
	queryCache: new QueryCache({
		onError: (error, query) => {
			const raw = error.message;
			// Sanitize: never expose SQL, stack traces, or internal details
			const isInternal =
				/\b(select|insert|update|delete|create|drop|alter)\b/i.test(raw) ||
				raw.includes("Failed query") ||
				raw.includes("params:") ||
				raw.includes("stack:") ||
				raw.includes("at ");
			const message = isInternal
				? "Erro ao carregar os dados. Tente novamente."
				: raw;
			toast.error(message, {
				action: {
					label: "retry",
					onClick: query.invalidate,
				},
			});
		},
	}),
});

export const trpcClient = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			url: `${env.VITE_SERVER_URL}/trpc`,
			fetch(url, options) {
				return fetch(url, {
					...options,
					credentials: "include",
				});
			},
		}),
	],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
	client: trpcClient,
	queryClient,
});
