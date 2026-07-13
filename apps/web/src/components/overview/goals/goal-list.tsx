"use client";

import type { Goal } from "@/features/finance/sdk";

const currencyFmt = new Intl.NumberFormat("pt-BR", {
	style: "currency",
	currency: "BRL",
});

export function GoalList({ goals }: { goals: Goal[] }) {
	return (
		<div className="flex flex-col gap-3">
			{goals.map((goal) => {
				const pct =
					goal.targetAmount > 0
						? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
						: 0;

				return (
					<div key={goal.id} className="flex flex-col gap-1.5">
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium">{goal.name}</span>
							<span className="text-xs text-muted-foreground">
								{currencyFmt.format(goal.currentAmount)} /{" "}
								{currencyFmt.format(goal.targetAmount)}
							</span>
						</div>
						<div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
							<div
								className="h-full rounded-full bg-primary transition-all"
								style={{ width: `${pct}%` }}
							/>
						</div>
					</div>
				);
			})}
		</div>
	);
}
