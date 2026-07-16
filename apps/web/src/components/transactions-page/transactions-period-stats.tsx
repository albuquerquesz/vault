"use client";

import {
	ArrowDownIcon,
	ArrowUpIcon,
	CalendarIcon,
	ClipboardListIcon,
} from "lucide-react";
import { MaskedMonetaryValue } from "@/components/monetary-visibility";
import { formatBRL, type TransactionsPeriodStats } from "./utils";

export function TransactionsPeriodStats({
	stats,
	periodLabel = "Últimos 30d",
}: {
	stats: TransactionsPeriodStats;
	periodLabel?: string;
}) {
	return (
		<div className="grid w-full grid-cols-2 gap-2 sm:flex sm:flex-1 sm:flex-wrap sm:items-center sm:gap-3">
			<div className="inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-2xl border border-border/60 bg-muted/40 px-3 text-xs text-muted-foreground sm:h-7 sm:flex-1 sm:rounded-full sm:px-2">
				<CalendarIcon className="size-3 shrink-0" aria-hidden />
				<span className="font-medium whitespace-nowrap">{periodLabel}</span>
			</div>

			<div
				className="flex min-w-0 items-center justify-center gap-1 rounded-2xl border border-border/60 bg-muted/20 px-3 py-2 text-xs tabular-nums sm:flex-1 sm:rounded-none sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:text-sm"
				title="Quantidade de transações"
			>
				<ClipboardListIcon
					className="size-3.5 shrink-0 text-muted-foreground"
					aria-hidden
				/>
				<span className="font-medium text-foreground">{stats.count}</span>
			</div>

			<div
				className="flex min-w-0 items-center justify-center gap-1 rounded-2xl border border-border/60 bg-muted/20 px-3 py-2 text-xs font-medium tabular-nums sm:flex-1 sm:rounded-none sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:text-sm"
				title="Total de saídas"
			>
				<ArrowDownIcon
					className="size-3.5 shrink-0 text-red-500"
					aria-hidden
				/>
				<span className="min-w-0 truncate text-foreground">
					<MaskedMonetaryValue format={formatBRL} value={stats.totalOut} />
				</span>
			</div>

			<div
				className="flex min-w-0 items-center justify-center gap-1 rounded-2xl border border-border/60 bg-muted/20 px-3 py-2 text-xs font-medium tabular-nums sm:flex-1 sm:rounded-none sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:text-sm"
				title="Total de entradas"
			>
				<ArrowUpIcon
					className="size-3.5 shrink-0 text-emerald-500"
					aria-hidden
				/>
				<span className="min-w-0 truncate text-foreground">
					<MaskedMonetaryValue format={formatBRL} value={stats.totalIn} />
				</span>
			</div>
		</div>
	);
}
