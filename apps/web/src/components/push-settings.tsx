import { Button } from "@vault/ui/components/button";
import * as React from "react";
import { apiFetch } from "@/utils/api";
import { currentSubscription, disablePush, isIosBrowser, isStandalone, rememberPushOwner, supportsPush } from "@/lib/push";

type Config = { available: boolean; publicKey: string | null };

export function PushSettings() {
	const [config, setConfig] = React.useState<Config | null>(null);
	const [enabled, setEnabled] = React.useState(false);
	const [busy, setBusy] = React.useState(false);
	const [message, setMessage] = React.useState("");
	React.useEffect(() => {
		void apiFetch<Config>("/api/push/config").then(setConfig).catch(() => setMessage("Não foi possível verificar as notificações."));
		void currentSubscription().then((sub) => setEnabled(Boolean(sub))).catch(() => {});
	}, []);

	const iosNeedsInstall = isIosBrowser() && !isStandalone();
	const permission = supportsPush() ? Notification.permission : "unsupported";
	async function enable() {
		if (!config?.publicKey) return;
		setBusy(true); setMessage("");
		try {
			const granted = await Notification.requestPermission();
			if (granted !== "granted") { setMessage("Permissão de notificações não concedida."); return; }
			const registration = await navigator.serviceWorker.ready;
			const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: config.publicKey });
			try {
				await apiFetch<void>("/api/push/subscriptions", { method: "POST", body: subscription.toJSON() });
			} catch (error) { await subscription.unsubscribe(); throw error; }
			setEnabled(true);
			await rememberPushOwner();
			setMessage("Notificações ativadas neste dispositivo.");
		} catch { setMessage("Não foi possível ativar as notificações."); }
		finally { setBusy(false); }
	}
	async function disable() {
		setBusy(true); setMessage("");
		try { await disablePush(); setEnabled(false); setMessage("Notificações desativadas neste dispositivo."); }
		catch { setMessage("Não foi possível remover a inscrição no servidor. Tente novamente."); }
		finally { setBusy(false); }
	}
	async function test() {
		const sub = await currentSubscription();
		if (!sub) return;
		setBusy(true); setMessage("");
		try { await apiFetch<void>("/api/push/test", { method: "POST", body: { endpoint: sub.endpoint } }); setMessage("Notificação de teste enviada."); }
		catch { setMessage("Não foi possível enviar o teste. Aguarde um minuto e tente novamente."); }
		finally { setBusy(false); }
	}

	return <section className="rounded-2xl border border-border/70 bg-background/60 p-5 space-y-3">
		<h2 className="text-lg font-medium">Notificações</h2>
		{iosNeedsInstall ? <p className="text-sm text-muted-foreground">No iPhone ou iPad, abra Compartilhar e escolha “Adicionar à Tela de Início” para receber notificações.</p> : null}
		{!supportsPush() ? <p className="text-sm text-muted-foreground">Este navegador não oferece notificações push.</p> : null}
		{permission === "denied" ? <p className="text-sm text-muted-foreground">Notificações bloqueadas. Altere a permissão nas configurações do navegador.</p> : null}
		{config && !config.available ? <p className="text-sm text-muted-foreground">Notificações indisponíveis no momento.</p> : null}
		{enabled ? <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" disabled={busy} onClick={() => void test()}>Enviar teste</Button><Button type="button" variant="outline" disabled={busy} onClick={() => void disable()}>Desativar</Button></div> :
			<Button type="button" disabled={busy || !supportsPush() || iosNeedsInstall || permission === "denied" || !config?.available} onClick={() => void enable()}>Ativar notificações</Button>}
		{message ? <p role="status" className="text-sm text-muted-foreground">{message}</p> : null}
	</section>;
}
