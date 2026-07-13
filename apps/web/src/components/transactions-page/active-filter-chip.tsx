"use client";

import { Badge } from "@vault/ui/components/badge";
import { XIcon } from "lucide-react";

export function ActiveFilterChip({
	label,
	onRemove,
}: {
	label: string;
	onRemove: () => void;
}) {
	return (
		<Badge
			variant="outline"
			className="gap-1.5 border-border/60 bg-muted/50 pr-1.5"
		>
			<span>{label}</span>
			<button
				aria-label={`Remover filtro ${label}`}
				className="inline-flex size-4 items-center justify-center rounded-full text-muted-foreground hover:bg-background hover:text-foreground"
				onClick={onRemove}
				type="button"
			>
				<XIcon className="size-3" />
			</button>
		</Badge>
	);
}
