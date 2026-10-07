"use client";

import { Button } from "@vault/ui/components/button";
import {
	AnimatedSidebarEyeIcon,
	AnimatedSidebarEyeOffIcon,
} from "@/components/animated-sidebar-icons";
import { useMonetaryVisibility } from "@/components/monetary-visibility";

/** Sidebar-only control for the global monetary visibility preference. */
export function MonetaryVisibilityToggle() {
	const { isVisible, toggle } = useMonetaryVisibility();

	return (
		<Button
			aria-label={
				isVisible ? "Ocultar valores monetários" : "Mostrar valores monetários"
			}
			aria-pressed={!isVisible}
			className="size-10 rounded-full p-0 text-muted-foreground"
			onClick={toggle}
			size="icon"
			type="button"
			variant="ghost"
		>
			{isVisible ? (
				<AnimatedSidebarEyeIcon
					className="size-10 [&_svg]:scale-125"
					size={52}
				/>
			) : (
				<AnimatedSidebarEyeOffIcon
					className="size-10 [&_svg]:scale-125"
					size={52}
				/>
			)}
		</Button>
	);
}
