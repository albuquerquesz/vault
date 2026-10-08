"use client";

import { cn } from "@vault/ui/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type FinanceMetric = {
	label: string;
	value: ReactNode;
	icon: LucideIcon;
	tone?: "default" | "income" | "expense";
};

const toneClass = {
	default: "text-white",
	income: "text-emerald-300",
	expense: "text-rose-300",
};

export function FinanceMetricStrip({ metrics }: { metrics: FinanceMetric[] }) {
	return (
		<div className="grid min-w-0 grid-cols-2 gap-4 border-t border-white/15 pt-4 sm:grid-cols-4 sm:gap-0 sm:pt-5">
			{metrics.map((metric, index) => {
				const Icon = metric.icon;
				return (
					<div
						className={cn(
							"min-w-0 space-y-1.5 sm:px-5 first:sm:pl-0 not-first:sm:border-l not-first:sm:border-white/15",
							index > 1 && "border-t border-white/15 pt-4 sm:border-t-0 sm:pt-0",
						)}
						key={metric.label}
					>
						<div className="flex items-center gap-2 text-xs text-zinc-400">
							<Icon aria-hidden className="size-3.5" />
							<span>{metric.label}</span>
						</div>
						<p className={cn("truncate text-lg font-medium tracking-tight tabular-nums sm:text-xl", toneClass[metric.tone ?? "default"])}>
							{metric.value}
						</p>
					</div>
				);
			})}
		</div>
	);
}
