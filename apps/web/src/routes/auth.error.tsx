import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { Button } from "@vault/ui/components/button";

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
	state_mismatch:
		"A autenticacao do Google expirou ou perdeu o estado esperado. Reinicie o login.",
	state_not_found:
		"A autenticacao do Google voltou sem o estado esperado. Reinicie o login.",
	please_restart_the_process:
		"A autenticacao nao conseguiu ser validada. Reinicie o login.",
	access_denied: "O login com Google foi cancelado antes da conclusao.",
	invalid_callback_request:
		"O retorno do provedor veio incompleto. Tente novamente.",
	invalid_code: "O codigo retornado pelo Google nao pode mais ser usado.",
	no_code: "O Google nao devolveu o codigo de autenticacao esperado.",
};

export const Route = createFileRoute("/auth/error")({
	validateSearch: (search) => ({
		error: typeof search.error === "string" ? search.error : undefined,
		error_description:
			typeof search.error_description === "string"
				? search.error_description
				: undefined,
		state: typeof search.state === "string" ? search.state : undefined,
	}),
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();
	const { error, error_description, state } = Route.useSearch();
	const errorCode = error ?? state;
	const title = "Nao foi possivel concluir o login com Google";
	const description =
		(errorCode && OAUTH_ERROR_MESSAGES[errorCode]) ||
		error_description ||
		"Vault recebeu uma falha no retorno do OAuth. Reinicie o fluxo e tente novamente.";

	return (
		<main className="flex min-h-0 w-full flex-1 bg-[#0c0a09] px-4 py-10 pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))] text-white sm:px-6 sm:py-12">
			<div className="mx-auto flex w-full max-w-md flex-col justify-center">
				<div className="rounded-3xl border border-red-500/20 bg-zinc-950/80 p-6 shadow-2xl shadow-black/30 backdrop-blur">
					<div className="mb-5 flex items-center gap-3">
						<div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-red-200">
							<AlertTriangle className="size-5" />
						</div>
						<div>
							<h1 className="text-lg font-semibold text-white">{title}</h1>
							<p className="text-sm text-zinc-400">Erro de autenticacao OAuth</p>
						</div>
					</div>

					<p className="text-sm leading-6 text-zinc-200">{description}</p>

					{errorCode ? (
						<p className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2 font-mono text-xs text-zinc-400">
							{errorCode}
						</p>
					) : null}

					<div className="mt-6 flex flex-col gap-3 sm:flex-row">
						<Button className="flex-1" onClick={() => navigate({ to: "/login" })}>
							Tentar de novo
						</Button>
						<Button
							variant="outline"
							className="flex-1"
							onClick={() => navigate({ to: "/" })}
						>
							Ir para o app
						</Button>
					</div>
				</div>
			</div>
		</main>
	);
}
