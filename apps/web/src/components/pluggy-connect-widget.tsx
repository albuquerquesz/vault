"use client";

import { useState } from "react";
import { Button } from "@vault/ui/components/button";
import { Loader2 } from "lucide-react";

const PLUGGY_CONNECT_SCRIPT_SRC =
	"https://cdn.pluggy.ai/pluggy-connect/v1.3.1/pluggy-connect.js";

interface PluggyConnectItem {
	id: string;
}

interface PluggyConnectSuccessPayload {
	item: PluggyConnectItem;
}

interface PluggyConnectErrorPayload {
	message?: string;
}

interface PluggyConnectInstance {
	init: () => void;
}

interface PluggyConnectConfig {
	connectToken: string;
	includeSandbox?: boolean;
	onSuccess?: (data: PluggyConnectSuccessPayload) => void;
	onError?: (error: PluggyConnectErrorPayload) => void;
	onClose?: () => void;
}

declare global {
	interface Window {
		PluggyConnect?: new (config: PluggyConnectConfig) => PluggyConnectInstance;
	}
}

let pluggyConnectScriptPromise: Promise<void> | null = null;

function loadPluggyConnectScript() {
	if (typeof window === "undefined") {
		return Promise.reject(new Error("Pluggy Connect is only available in the browser"));
	}

	if (window.PluggyConnect) {
		return Promise.resolve();
	}

	if (pluggyConnectScriptPromise) {
		return pluggyConnectScriptPromise;
	}

	pluggyConnectScriptPromise = new Promise<void>((resolve, reject) => {
		const existing = document.querySelector<HTMLScriptElement>(
			`script[src="${PLUGGY_CONNECT_SCRIPT_SRC}"]`,
		);

		if (existing) {
			existing.addEventListener("load", () => resolve(), { once: true });
			existing.addEventListener(
				"error",
				() => reject(new Error("Failed to load Pluggy Connect")),
				{ once: true },
			);
			return;
		}

		const script = document.createElement("script");
		script.src = PLUGGY_CONNECT_SCRIPT_SRC;
		script.async = true;
		script.onload = () => resolve();
		script.onerror = () => reject(new Error("Failed to load Pluggy Connect"));
		document.head.appendChild(script);
	});

	return pluggyConnectScriptPromise;
}

interface PluggyConnectWidgetProps {
	onSuccess?: (data: PluggyConnectSuccessPayload) => void;
	onError?: (error: Error) => void;
	onClose?: () => void;
	className?: string;
}

export function PluggyConnectWidget({
	onSuccess,
	onError,
	onClose,
	className,
}: PluggyConnectWidgetProps) {
	const [isConnecting, setIsConnecting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleConnect = async () => {
		setError(null);
		setIsConnecting(true);

		try {
			const tokenResponse = await fetch("/api/connectors/token", {
				method: "POST",
				credentials: "include",
			});

			if (!tokenResponse.ok) {
				const body = await tokenResponse.text().catch(() => "");
				throw new Error(body || "Failed to create Pluggy connect token");
			}

			const { accessToken } = (await tokenResponse.json()) as {
				accessToken?: string;
			};

			if (!accessToken) {
				throw new Error("Missing Pluggy connect token");
			}

			await loadPluggyConnectScript();

			if (!window.PluggyConnect) {
				throw new Error("Pluggy Connect SDK unavailable");
			}

			const widget = new window.PluggyConnect({
				connectToken: accessToken,
				onSuccess: (data) => {
					setIsConnecting(false);
					onSuccess?.(data);
				},
				onError: (sdkError) => {
					const nextError = new Error(
						sdkError.message || "Failed to connect account with Pluggy",
					);
					setIsConnecting(false);
					setError(nextError.message);
					onError?.(nextError);
				},
				onClose: () => {
					setIsConnecting(false);
					onClose?.();
				},
			});

			widget.init();
		} catch (caughtError) {
			const nextError =
				caughtError instanceof Error
					? caughtError
					: new Error("Failed to initialize Pluggy Connect");
			setIsConnecting(false);
			setError(nextError.message);
			onError?.(nextError);
		}
	};

	return (
		<div className="space-y-4">
			<Button
				onClick={handleConnect}
				disabled={isConnecting}
				className={className}
			>
				{isConnecting ? (
					<>
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						Conectando...
					</>
				) : (
					"Conectar Banco"
				)}
			</Button>

			{error ? (
				<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
					{error}
				</div>
			) : null}
		</div>
	);
}
