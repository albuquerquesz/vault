"use client";

import { Button } from "@vault/ui/components/button";
import { Input } from "@vault/ui/components/input";
import { SearchIcon, XIcon } from "lucide-react";
import type { ReactNode } from "react";

export function DataQueryToolbar({
	value,
	onValueChange,
	placeholder,
	filterControl,
	activeFilters = 0,
	onClear,
}: {
	value: string;
	onValueChange: (value: string) => void;
	placeholder: string;
	filterControl: ReactNode;
	activeFilters?: number;
	onClear?: () => void;
}) {
	const hasQuery = value.trim().length > 0;
	const isActive = hasQuery || activeFilters > 0;

	return (
		<div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
			<div className="relative min-w-0 flex-1">
				<SearchIcon aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					aria-label={placeholder}
					className="min-h-10 w-full rounded-md border-border/70 bg-background pl-10 shadow-none"
					onChange={(event) => onValueChange(event.target.value)}
					placeholder={placeholder}
					value={value}
				/>
			</div>
			<div className="flex shrink-0 items-center gap-2">
				{filterControl}
				{isActive && onClear ? (
					<Button
						aria-label="Limpar busca e filtros"
						className="h-10 px-2.5 text-muted-foreground hover:text-foreground"
						onClick={onClear}
						variant="ghost"
					>
						<XIcon aria-hidden className="size-4" />
						<span className="hidden sm:inline">Limpar</span>
					</Button>
				) : null}
			</div>
		</div>
	);
}
