"use client";

import { AlertTriangle, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { usePluggyConnectToken } from "@/features/pluggy/sdk";
import { queryClient } from "@/utils/api";

type PluggyConnectInstance = {
	init: (containerElement?: HTMLElement) => Promise<void>;
	destroy: () => Promise<void> | void;
};

type PluggyConnectOptions = {
	connectToken: string;
	includeSandbox?: boolean;
	allowFullscreen?: boolean;
	theme?: "light" | "dark";
	onSuccess?: (payload: unknown) => void;
	onError?: (error: unknown) => void;
};

type WindowWithPluggy = Window &
	typeof globalThis & {
		PluggyConnect?: new (options: PluggyConnectOptions) => PluggyConnectInstance;
	};

const PLUGGY_CONNECT_SCRIPT =
	"https://cdn.pluggy.ai/pluggy-connect/v2.7.0/pluggy-connect.js";

let pluggyScriptPromise: Promise<void> | null = null;

function loadPluggyConnectScript() {
	if (typeof window === "undefined") {
		return Promise.reject(new Error("Pluggy Connect só pode carregar no browser"));
	}

	const win = window as WindowWithPluggy;
	if (win.PluggyConnect) {
		return Promise.resolve();
	}

	if (!pluggyScriptPromise) {
		pluggyScriptPromise = new Promise<void>((resolve, reject) => {
			const existingScript = document.querySelector<HTMLScriptElement>(
				`script[src="${PLUGGY_CONNECT_SCRIPT}"]`,
			);

			if (existingScript) {
				existingScript.addEventListener("load", () => resolve(), { once: true });
				existingScript.addEventListener("error", () => {
					reject(new Error("Falha ao carregar o script do Pluggy Connect"));
				}, { once: true });
				return;
			}

			const script = document.createElement("script");
			script.src = PLUGGY_CONNECT_SCRIPT;
			script.async = true;
			script.onload = () => resolve();
			script.onerror = () =>
				reject(new Error("Falha ao carregar o script do Pluggy Connect"));
			document.head.appendChild(script);
		});
	}

	return pluggyScriptPromise;
}

export function PluggyConnectWidget() {
	const containerRef = useRef<HTMLDivElement>(null);
	const widgetRef = useRef<PluggyConnectInstance | null>(null);
	const [status, setStatus] = useState<"loading" | "ready" | "error">(
		"loading",
	);
	const [error, setError] = useState<string | null>(null);
	const { mutateAsync: getConnectToken } = usePluggyConnectToken();

	useEffect(() => {
		let cancelled = false;

		async function boot() {
			try {
				setStatus("loading");
				setError(null);

				const [{ accessToken }, container] = await Promise.all([
					getConnectToken(undefined),
					Promise.resolve(containerRef.current),
				]);

				if (cancelled) return;
				if (!container) {
					throw new Error("Container do Pluggy não foi encontrado");
				}

				await loadPluggyConnectScript();

				if (cancelled) return;

				const win = window as WindowWithPluggy;
				if (!win.PluggyConnect) {
					throw new Error("Pluggy Connect não foi inicializado corretamente");
				}

				widgetRef.current?.destroy();
				const widget = new win.PluggyConnect({
					connectToken: accessToken,
					allowFullscreen: true,
					includeSandbox: import.meta.env.DEV,
					onSuccess: async () => {
						await queryClient.invalidateQueries({
							queryKey: ["pluggyItems"],
						});
						await queryClient.invalidateQueries({
							queryKey: ["pluggyTransactions"],
						});
					},
					onError: (widgetError) => {
						console.error("Pluggy Connect error:", widgetError);
						setError(
							widgetError instanceof Error
								? widgetError.message
								: "O Pluggy Connect não conseguiu abrir",
						);
						setStatus("error");
					},
				});

				widgetRef.current = widget;
				await widget.init(container);
				if (!cancelled) {
					setStatus("ready");
				}
			} catch (err) {
				if (cancelled) return;
				const message =
					err instanceof Error ? err.message : "Falha ao abrir o Pluggy Connect";
				setError(message);
				setStatus("error");
			}
		}

		void boot();

		return () => {
			cancelled = true;
			widgetRef.current?.destroy();
			widgetRef.current = null;
		};
	}, [getConnectToken]);

	if (status === "loading") {
		return (
			<div className="rounded-2xl border border-border/70 bg-card/60 px-5 py-6">
				<div className="flex items-center gap-3 text-sm text-muted-foreground">
					<Loader2 className="size-4 animate-spin" />
					<span>Iniciando o Connect do Pluggy...</span>
				</div>
				<div
					ref={containerRef}
					className="mt-5 min-h-[560px] rounded-[1.5rem] border border-border/60 bg-background/70"
				/>
			</div>
		);
	}

	if (status === "error") {
		return (
			<div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-6">
				<div className="flex items-start gap-3">
					<AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
					<div className="space-y-1">
						<p className="text-sm font-medium text-foreground">
							Não foi possível abrir o Pluggy Connect
						</p>
						<p className="text-sm text-muted-foreground">{error}</p>
					</div>
				</div>
				<div
					ref={containerRef}
					className="mt-5 min-h-[560px] rounded-[1.5rem] border border-border/60 bg-background/70"
				/>
			</div>
		);
	}

	return (
		<div className="rounded-2xl border border-border/70 bg-card/60 px-5 py-6">
			<div className="flex items-center gap-3 text-sm text-emerald-400">
				<ShieldCheck className="size-4" />
				<span>Pluggy Connect ativo</span>
			</div>
			<div
				ref={containerRef}
				className="mt-5 min-h-[560px] rounded-[1.5rem] border border-border/60 bg-background/70"
			/>
		</div>
	);
}
