"use client";

import { cn } from "@vault/ui/lib/utils";
import type { ReactNode } from "react";

type OverviewCardStateProps = {
	message?: string;
	fallback?: ReactNode;
	className?: string;
};

function OverviewCardMessage({
	message,
	className,
}: {
	message: string;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex flex-1 items-center justify-center text-center text-sm text-muted-foreground",
				className,
			)}
		>
			{message}
		</div>
	);
}

export function OverviewCardLoadingState({
	message = "Carregando...",
	fallback,
	className,
}: OverviewCardStateProps) {
	if (fallback) {
		return <>{fallback}</>;
	}

	return <OverviewCardMessage className={className} message={message} />;
}

export function OverviewCardEmptyState({
	message = "Nenhum dado encontrado.",
	className,
}: OverviewCardStateProps) {
	return <OverviewCardMessage className={className} message={message} />;
}

export function OverviewCardErrorState({
	message = "Não foi possível carregar os dados.",
	className,
}: OverviewCardStateProps) {
	return <OverviewCardMessage className={className} message={message} />;
}
