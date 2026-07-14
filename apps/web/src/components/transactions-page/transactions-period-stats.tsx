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
		<div className="flex w-full flex-1 items-center gap-2.5 sm:gap-3">
			<div className="inline-flex h-7 flex-1 items-center justify-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2 text-xs text-muted-foreground">
				<CalendarIcon className="size-3 shrink-0" aria-hidden />
				<span className="font-medium whitespace-nowrap">{periodLabel}</span>
			</div>

			<div
				className="flex flex-1 items-center justify-center gap-1 text-xs tabular-nums sm:text-sm"
				title="Quantidade de transações"
			>
				<ClipboardListIcon
					className="size-3.5 shrink-0 text-muted-foreground"
					aria-hidden
				/>
				<span className="font-medium text-foreground">{stats.count}</span>
			</div>

			<div
				className="flex flex-1 items-center justify-center gap-1 text-xs font-medium tabular-nums sm:text-sm"
				title="Total de saídas"
			>
				<ArrowDownIcon
					className="size-3.5 shrink-0 text-emerald-500"
					aria-hidden
				/>
				<span className="text-foreground">
					<MaskedMonetaryValue format={formatBRL} value={stats.totalOut} />
				</span>
			</div>

			<div
				className="flex flex-1 items-center justify-center gap-1 text-xs font-medium tabular-nums sm:text-sm"
				title="Total de entradas"
			>
				<ArrowUpIcon className="size-3.5 shrink-0 text-red-500" aria-hidden />
				<span className="text-foreground">
					<MaskedMonetaryValue format={formatBRL} value={stats.totalIn} />
				</span>
			</div>
		</div>
	);
}
