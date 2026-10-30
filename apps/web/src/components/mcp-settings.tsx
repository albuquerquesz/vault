"use client";

import { Button } from "@vault/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@vault/ui/components/card";
import { Input } from "@vault/ui/components/input";
import {
	CopyIcon,
	GlobeIcon,
	KeyRoundIcon,
	Loader2,
	PlusIcon,
	Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	useCreateMcpToken,
	useMcpTokens,
	useRevokeMcpToken,
} from "@/features/settings/sdk";
import { authClient } from "@/lib/auth-client";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
	dateStyle: "medium",
	timeStyle: "short",
});

function formatDate(value: string | null) {
	return value ? dateFormatter.format(new Date(value)) : "Nunca usado";
}

const REMOTE_CLIENT_STEPS = [
	[
		"Claude (web/desktop)",
		"Configurações → Conectores → Adicionar conector personalizado → cole a URL",
	],
	["ChatGPT", "Configurações → Conectores → criar conector com a URL"],
	["Claude Code", "claude mcp add --transport http vault <URL>"],
	["Cursor / VS Code", "Adicione um servidor MCP HTTP com a URL"],
] as const;

/** Remote MCP over OAuth: paste the URL in the client and sign in to Vault. */
function RemoteMcpCard() {
	const url = `${window.location.origin}/api/mcp`;
	return (
		<Card className="rounded-2xl border border-border/70 bg-background/60 ring-0">
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-lg font-medium">
					<GlobeIcon className="size-4 text-muted-foreground" />
					MCP remoto
				</CardTitle>
				<p className="text-sm text-muted-foreground">
					Conecte o Vault ao Claude, ChatGPT, Cursor ou VS Code. Cole a URL no
					app e faça login no Vault quando ele pedir. O agente pode consultar
					seus dados e registrar transações e metas.
				</p>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex gap-2">
					<Input readOnly value={url} className="font-mono text-sm" />
					<Button
						type="button"
						variant="outline"
						onClick={async () => {
							await navigator.clipboard.writeText(url);
							toast.success("URL copiada");
						}}
					>
						<CopyIcon className="size-4" />
						Copiar
					</Button>
				</div>
				<ul className="space-y-2 text-sm">
					{REMOTE_CLIENT_STEPS.map(([client, step]) => (
						<li key={client}>
							<span className="font-medium">{client}:</span>{" "}
							<span className="text-muted-foreground">
								{step.replace("<URL>", url)}
							</span>
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	);
}

export function McpSettings() {
	const { data: session, isPending: isSessionPending } =
		authClient.useSession();
	const isAuthenticated = !isSessionPending && Boolean(session?.user);
	const { data: tokens, isLoading } = useMcpTokens({
		enabled: isAuthenticated,
	});
	const createToken = useCreateMcpToken();
	const revokeToken = useRevokeMcpToken();
	const [name, setName] = useState("Vault local");
	const [createdToken, setCreatedToken] = useState<string | null>(null);

	const handleCreate = (event: React.FormEvent) => {
		event.preventDefault();
		const trimmedName = name.trim();
		if (!trimmedName || createToken.isPending) return;

		createToken.mutate(
			{ name: trimmedName },
			{ onSuccess: (token) => setCreatedToken(token.token) },
		);
	};

	const handleCopy = async () => {
		if (!createdToken) return;
		try {
			await navigator.clipboard.writeText(createdToken);
			toast.success("Token copiado");
		} catch {
			toast.error("Não foi possível copiar o token");
		}
	};

	return (
		<div className="space-y-4">
			<RemoteMcpCard />
			<Card className="rounded-2xl border border-border/70 bg-background/60 ring-0">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-lg font-medium">
						<KeyRoundIcon className="size-4 text-muted-foreground" />
						MCP local
					</CardTitle>
					<p className="text-sm text-muted-foreground">
						Crie um token para conectar o Vault a um agente local via MCP. O
						token permite apenas consultas financeiras.
					</p>
				</CardHeader>
				<CardContent className="space-y-4">
					<form
						className="flex flex-col gap-2 sm:flex-row"
						onSubmit={handleCreate}
					>
						<Input
							aria-label="Nome do token MCP"
							className="h-10 rounded-md text-sm"
							maxLength={100}
							onChange={(event) => setName(event.target.value)}
							placeholder="Nome do token"
							value={name}
						/>
						<Button
							className="min-h-10 rounded-md sm:w-auto"
							disabled={!name.trim() || createToken.isPending}
							type="submit"
						>
							{createToken.isPending ? (
								<Loader2 className="size-4 animate-spin" />
							) : (
								<PlusIcon className="size-4" />
							)}
							Criar token
						</Button>
					</form>

					{createdToken ? (
						<div className="space-y-2 rounded-xl border border-amber-300/60 bg-amber-50 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
							<p className="text-sm font-medium text-amber-950 dark:text-amber-100">
								Copie este token agora. Ele não será mostrado novamente.
							</p>
							<div className="flex gap-2">
								<code className="min-w-0 flex-1 overflow-x-auto rounded-md bg-background px-2 py-2 text-xs text-foreground">
									{createdToken}
								</code>
								<Button
									className="shrink-0 rounded-md"
									onClick={handleCopy}
									type="button"
									variant="outline"
								>
									Copiar
								</Button>
							</div>
						</div>
					) : null}

					{isLoading ? (
						<p className="text-sm text-muted-foreground">Carregando tokens…</p>
					) : tokens && tokens.length > 0 ? (
						<div className="space-y-2">
							{tokens.map((token) => {
								const revoked = Boolean(token.revokedAt);
								return (
									<div
										className="flex flex-col gap-3 rounded-lg border border-border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
										key={token.id}
									>
										<div className="min-w-0 space-y-1">
											<p className="truncate text-sm font-medium">
												{token.name}
											</p>
											<p className="font-mono text-xs text-muted-foreground">
												{token.tokenPrefix}… · criado{" "}
												{formatDate(token.createdAt)}
											</p>
											<p className="text-xs text-muted-foreground">
												{revoked
													? `Revogado em ${formatDate(token.revokedAt)}`
													: `Último uso: ${formatDate(token.lastUsedAt)}`}
											</p>
										</div>
										{revoked ? null : (
											<Button
												className="min-h-10 shrink-0 rounded-md"
												disabled={revokeToken.isPending}
												onClick={() => revokeToken.mutate(token.id)}
												type="button"
												variant="destructive"
											>
												<Trash2Icon className="size-4" />
												Revogar
											</Button>
										)}
									</div>
								);
							})}
						</div>
					) : (
						<p className="text-sm text-muted-foreground">
							Nenhum token MCP criado.
						</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
