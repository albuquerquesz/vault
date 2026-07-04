"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
} from "@vault/ui/components/card";
import { ArrowUpRight, CreditCardIcon } from "lucide-react";

type BillItem = {
	name: string;
	paid: number;
	total: number;
};

type MonthlyBillCardProps = {
	totalBill?: number;
	items?: BillItem[];
	detailHref?: string;
	title?: string;
};

const DEFAULT_ITEMS: BillItem[] = [
	{ name: "Gold", paid: 478.36, total: 550 },
	{ name: "Streaming", paid: 39.9, total: 39.9 },
	{ name: "Cloud", paid: 19.9, total: 29.9 },
];

const fmt = (value: number) =>
	new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
	}).format(value);

export function MonthlyBillCard({
	totalBill = 550,
	items = DEFAULT_ITEMS,
	detailHref,
	title = "Faturas do mês",
}: MonthlyBillCardProps) {
	const totalPaid = items.reduce((sum, item) => sum + item.paid, 0);
	const percentage = totalBill > 0 ? (totalPaid / totalBill) * 100 : 0;

	return (
		<Card className="financial-panel-border ring-0">
			<CardHeader className="gap-4">
				<div className="flex items-center justify-between gap-4">
					<div className="flex items-center gap-2">
						<CreditCardIcon className="size-4 text-muted-foreground" />
						<CardDescription className="text-base">{title}</CardDescription>
					</div>
					<ArrowUpRight className="size-4 text-muted-foreground" />
				</div>
			</CardHeader>
			<CardContent className="flex flex-col gap-6">
				{/* Total */}
				<div>
					<div className="text-3xl font-semibold tabular-nums">
						{fmt(totalBill)}
					</div>
					<div className="text-muted-foreground text-sm">Total do mês</div>
				</div>

				{/* Bill items list */}
				<div className="space-y-4">
					{items.map((item) => {
						const itemPct =
							item.total > 0 ? (item.paid / item.total) * 100 : 0;
						return (
							<div key={item.name} className="space-y-2">
								<div className="flex items-center justify-between text-sm">
									<div className="flex items-center gap-2">
										<div className="flex items-center justify-center rounded bg-foreground/10 text-foreground size-6 text-xs font-medium">
											{item.name[0].toLowerCase()}
										</div>
										<span className="font-medium">{item.name}</span>
									</div>
									<div className="flex items-center gap-2 tabular-nums">
										<span>{fmt(item.paid)}</span>
										<span className="text-muted-foreground">
											/ {fmt(item.total)}
										</span>
										<span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums">
											{itemPct.toFixed(0)}%
										</span>
									</div>
								</div>
								<div className="h-1.5 overflow-hidden rounded-full bg-muted">
									<div
										className="h-full bg-foreground/80 transition-all"
										style={{ width: `${itemPct}%` }}
									/>
								</div>
							</div>
						);
					})}
				</div>

				{/* Summary */}
				<div className="flex items-center justify-between border-t pt-4 text-sm">
					<span className="text-muted-foreground">Total pago</span>
					<span className="font-medium tabular-nums text-emerald-500">
						{fmt(totalPaid)}
					</span>
				</div>
			</CardContent>
		</Card>
	);
}
