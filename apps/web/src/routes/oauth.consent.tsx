import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@vault/ui/components/button";
import { KeyRound, Loader2 } from "lucide-react";
import { useState } from "react";
import { VaultLogo } from "@/components/vault-logo";
import { authClient } from "@/lib/auth-client";

/** What each OAuth scope lets the connected app do, in the user's words. */
const SCOPE_LABELS: Record<string, string> = {
	openid: "Confirmar que é você",
	profile: "Ver seu nome e foto",
	email: "Ver seu e-mail",
	offline_access: "Continuar conectado sem pedir login de novo",
};

type PublicClient = {
	client_name?: string;
	client_uri?: string;
	logo_uri?: string;
};

export const Route = createFileRoute("/oauth/consent")({
	validateSearch: (search) => ({
		client_id: typeof search.client_id === "string" ? search.client_id : "",
		scope: typeof search.scope === "string" ? search.scope : "",
	}),
	component: RouteComponent,
});

function RouteComponent() {
	const { client_id: clientId, scope } = Route.useSearch();
	const { data: session } = authClient.useSession();
	const [pending, setPending] = useState<"accept" | "deny" | null>(null);
	const [error, setError] = useState<string | null>(null);

	const client = useQuery({
		queryKey: ["oauth-public-client", clientId],
		enabled: Boolean(clientId),
		queryFn: async () => {
			const result = await authClient.oauth2.publicClient({
				query: { client_id: clientId },
			});
			if (result.error) throw new Error(result.error.message);
			return result.data as PublicClient;
		},
	});

	const scopes = scope.split(" ").filter(Boolean);
	const clientName = client.data?.client_name || "Um aplicativo";

	async function respond(accept: boolean) {
		setPending(accept ? "accept" : "deny");
		setError(null);
		const result = await authClient.oauth2.consent({ accept });
		const url = (result.data as { url?: string } | null)?.url;
		if (result.error || !url) {
			setPending(null);
			setError(
				result.error?.message ??
					"Não foi possível concluir a autorização. Tente novamente.",
			);
			return;
		}
		window.location.href = url;
	}

	return (
		<main className="flex min-h-0 w-full flex-1 items-center justify-center bg-white px-4 py-10 text-zinc-900">
			<div className="w-full max-w-md space-y-6">
				<div className="flex justify-center">
					<VaultLogo showName={false} size="lg" />
				</div>

				<div className="space-y-5 rounded-2xl border border-zinc-200 p-6">
					<div className="flex items-center gap-3">
						{client.data?.logo_uri ? (
							<img
								alt=""
								className="size-10 rounded-lg object-contain"
								src={client.data.logo_uri}
							/>
						) : (
							<div className="flex size-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
								<KeyRound className="size-5" />
							</div>
						)}
						<div className="min-w-0">
							<h1 className="truncate text-lg font-semibold">
								{client.isPending ? "Carregando…" : clientName}
							</h1>
							<p className="text-sm text-zinc-500">
								quer acessar sua conta do Vault
							</p>
						</div>
					</div>

					<p className="text-sm leading-6 text-zinc-600">
						Ao permitir, {clientName} poderá consultar seus dados financeiros e
						registrar transações e metas em seu nome
						{session?.user.email ? ` (${session.user.email})` : ""}.
					</p>

					{scopes.length > 0 ? (
						<ul className="space-y-1.5 text-sm text-zinc-700">
							{scopes.map((item) => (
								<li key={item} className="flex items-center gap-2">
									<span className="size-1.5 rounded-full bg-zinc-400" />
									{SCOPE_LABELS[item] ?? item}
								</li>
							))}
						</ul>
					) : null}

					{error || client.error ? (
						<p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
							{error ?? (client.error as Error).message}
						</p>
					) : null}

					<div className="flex flex-col gap-3 sm:flex-row">
						<Button
							variant="outline"
							className="flex-1"
							disabled={pending !== null}
							onClick={() => respond(false)}
						>
							{pending === "deny" ? (
								<Loader2 className="size-4 animate-spin" />
							) : null}
							Negar
						</Button>
						<Button
							className="flex-1"
							disabled={pending !== null || !clientId}
							onClick={() => respond(true)}
						>
							{pending === "accept" ? (
								<Loader2 className="size-4 animate-spin" />
							) : null}
							Permitir
						</Button>
					</div>
				</div>
			</div>
		</main>
	);
}
