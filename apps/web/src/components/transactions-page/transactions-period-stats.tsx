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
		<div className="flex flex-wrap items-center gap-3 sm:gap-4">
			<div className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2.5 text-sm text-muted-foreground">
				<CalendarIcon className="size-3.5 shrink-0" aria-hidden />
				<span className="font-medium whitespace-nowrap">{periodLabel}</span>
			</div>

			<div
				className="flex items-center gap-1.5 text-sm tabular-nums sm:text-base"
				title="Quantidade de transações"
			>
				<ClipboardListIcon
					className="size-4 shrink-0 text-muted-foreground"
					aria-hidden
				/>
				<span className="font-medium text-foreground">{stats.count}</span>
			</div>

			<div
				className="flex items-center gap-1 text-sm font-medium tabular-nums sm:text-base"
				title="Total de saídas"
			>
				<ArrowDownIcon
					className="size-4 shrink-0 text-emerald-500"
					aria-hidden
				/>
				<span className="text-foreground">
					<MaskedMonetaryValue format={formatBRL} value={stats.totalOut} />
				</span>
			</div>

			<div
				className="flex items-center gap-1 text-sm font-medium tabular-nums sm:text-base"
				title="Total de entradas"
			>
				<ArrowUpIcon className="size-4 shrink-0 text-red-500" aria-hidden />
				<span className="text-foreground">
					<MaskedMonetaryValue format={formatBRL} value={stats.totalIn} />
				</span>
			</div>
		</div>
	);
}
