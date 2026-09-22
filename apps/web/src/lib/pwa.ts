import { registerSW } from "virtual:pwa-register";
import { toast } from "sonner";

export function registerPwa() {
	if (!("serviceWorker" in navigator)) return;
	const update = registerSW({
		onNeedRefresh() {
			toast("Nova versão do Vault disponível", {
				duration: Infinity,
				action: { label: "Atualizar", onClick: () => void update(true) },
			});
		},
	});
}
