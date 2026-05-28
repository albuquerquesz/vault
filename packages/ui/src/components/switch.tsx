"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cn } from "@vault/ui/lib/utils";

function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
	return (
		<SwitchPrimitive.Root
			data-slot="switch"
			className={cn(
				"peer inline-flex h-4 w-7 shrink-0 items-center rounded-full border border-input bg-background p-0.5 transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-checked:border-primary data-checked:bg-primary",
				className,
			)}
			{...props}
		>
			<SwitchPrimitive.Thumb
				data-slot="switch-thumb"
				className="size-3 rounded-full bg-foreground transition-transform data-checked:translate-x-3 data-unchecked:translate-x-0 data-checked:bg-primary-foreground"
			/>
		</SwitchPrimitive.Root>
	);
}

export { Switch };
