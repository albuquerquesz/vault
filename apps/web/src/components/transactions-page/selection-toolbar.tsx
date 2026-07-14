"use client";

import { Button } from "@vault/ui/components/button";
import { useSidebar } from "@vault/ui/components/sidebar";
import { cn } from "@vault/ui/lib/utils";
import { Loader2Icon, Trash2Icon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/** Matches `SIDEBAR_WIDTH` / `SIDEBAR_WIDTH_ICON` in @vault/ui sidebar. */
const SIDEBAR_OFFSET_EXPANDED = "16rem";
const SIDEBAR_OFFSET_ICON = "3rem";

export function TransactionsSelectionToolbar({
	selectedCount,
	onClear,
	onDelete,
	isDeleting = false,
	className,
}: {
	selectedCount: number;
	onClear: () => void;
	onDelete: () => void;
	isDeleting?: boolean;
	className?: string;
}) {
	const [mounted, setMounted] = useState(false);
	const { state, isMobile } = useSidebar();

	useEffect(() => {
		setMounted(true);
	}, []);

	if (selectedCount <= 0 || !mounted) {
		return null;
	}

	const label =
		selectedCount === 1 ? "1 Selecionado" : `${selectedCount} Selecionados`;

	// Center within the main content column, not the full viewport.
	const leftOffset = isMobile
		? 0
		: state === "expanded"
			? SIDEBAR_OFFSET_EXPANDED
			: SIDEBAR_OFFSET_ICON;

	return createPortal(
		<div
			className="pointer-events-none fixed bottom-0 z-[200] flex justify-center px-4 pt-2 transition-[left] duration-200 ease-linear"
			style={{
				position: "fixed",
				bottom: 0,
				left: leftOffset,
				right: 0,
				zIndex: 200,
				paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 0px))",
			}}
			role="presentation"
		>
			<div
				className={cn(
					"pointer-events-auto flex items-center gap-1 rounded-full border border-border/70 bg-card/95 p-1 pl-3 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/95",
					className,
				)}
				role="toolbar"
				aria-label="Ações da seleção"
			>
				<span className="pr-2 text-sm font-medium tabular-nums text-foreground">
					{label}
				</span>

				<div
					aria-hidden
					className="mx-0.5 h-5 w-px shrink-0 bg-border dark:bg-white/15"
				/>

				<Button
					className="h-8 gap-1.5 rounded-full border-destructive/40 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive dark:border-destructive/50 dark:hover:bg-destructive/20"
					disabled={isDeleting}
					onClick={onDelete}
					size="sm"
					type="button"
					variant="outline"
				>
					{isDeleting ? (
						<Loader2Icon className="size-3.5 animate-spin" />
					) : (
						<Trash2Icon className="size-3.5" />
					)}
					Excluir
				</Button>

				<Button
					aria-label="Limpar seleção"
					className="size-8 rounded-full"
					disabled={isDeleting}
					onClick={onClear}
					size="icon-sm"
					type="button"
					variant="ghost"
				>
					<XIcon className="size-3.5" />
				</Button>
			</div>
		</div>,
		document.body,
	);
}
