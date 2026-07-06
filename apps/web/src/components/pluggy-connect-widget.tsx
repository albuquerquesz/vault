"use client";

import { useEffect, useRef, useState } from "react";
import { usePluggyConnectToken } from "@/features/pluggy/sdk";

const PLUGGY_WIDGET_URL = "https://connect.pluggy.ai";

export function PluggyConnectWidget() {
	const [connectToken, setConnectToken] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const { mutateAsync: getConnectToken, isPending } = usePluggyConnectToken();

	useEffect(() => {
		getConnectToken()
			.then((data) => {
				setConnectToken(data.accessToken);
			})
			.catch((err: Error) => {
				setError(err.message);
			});
	}, [getConnectToken]);

	useEffect(() => {
		if (!iframeRef.current) return;
		const handleMessage = (event: MessageEvent) => {
			if (event.origin !== PLUGGY_WIDGET_URL) return;
			if (event.data?.type === "pluggy:connected") {
				console.log("Pluggy connected:", event.data);
			}
			if (event.data?.type === "pluggy:error") {
				setError(event.data.error);
			}
		};
		window.addEventListener("message", handleMessage);
		return () => window.removeEventListener("message", handleMessage);
	}, []);

	if (isPending) {
		return (
			<div className="flex items-center justify-center p-8">
				<p className="text-muted-foreground">Carregando...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-4 rounded-lg border border-destructive/50 bg-destructive/10">
				<p className="text-destructive">Erro: {error}</p>
			</div>
		);
	}

	return (
		<div className="w-full h-[600px]">
			<iframe
				ref={iframeRef}
				src={`${PLUGGY_WIDGET_URL}/connect?token=${connectToken}`}
				className="w-full h-full border-0"
				title="Pluggy Connect"
			/>
		</div>
	);
}
