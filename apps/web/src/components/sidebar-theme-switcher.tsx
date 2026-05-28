"use client";

import { Switch } from "@vault/ui/components/switch";
import { useTheme } from "@/components/theme-provider";

export function SidebarThemeSwitcher() {
	const { resolvedTheme, setTheme } = useTheme();
	const checked = resolvedTheme === "dark";

	return (
		<div className="flex items-center justify-between px-2 py-1">
			<span className="text-muted-foreground text-xs">Tema escuro</span>
			<Switch
				checked={checked}
				onCheckedChange={(next) => setTheme(next ? "dark" : "light")}
				aria-label="Alternar tema escuro"
			/>
		</div>
	);
}
