"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
} from "@vault/ui/components/card";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@vault/ui/components/tooltip";
import {
	CreditCardIcon,
	Info,
} from "lucide-react";

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
	const _percentage = totalBill > 0 ? (totalPaid / totalBill) * 100 : 0;

	return (
		<Card className="financial-panel-border ring-0">
			<CardHeader className="border-b">
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-2">
						<CreditCardIcon className="size-4 text-muted-foreground" />
						<CardDescription className="text-base">{title}</CardDescription>
					</div>
					<Tooltip>
						<TooltipTrigger render={<Info className="size-4 text-muted-foreground" />} />
						<TooltipContent>Resumo das faturas e pagamentos do mês</TooltipContent>
					</Tooltip>
				</div>
			</CardHeader>
			<CardContent className="flex flex-col gap-6">
				{/* Total */}
				<div className="text-3xl font-semibold tabular-nums">
					{fmt(totalBill)}
				</div>

				{/* Bill items list */}
				<div className="space-y-8">
					{items.map((item) => {
						const itemPct = item.total > 0 ? (item.paid / item.total) * 100 : 0;
						return (
							<div
								key={item.name}
								className="flex items-center justify-between text-base"
							>
								<div className="flex items-center gap-2">
									<div className="flex items-center justify-center rounded bg-foreground/10 text-foreground size-7 text-sm font-medium">
										{item.name[0].toLowerCase()}
									</div>
									<span className="font-medium">{item.name}</span>
								</div>
								<div className="flex items-center gap-2 tabular-nums text-lg">
									<span>{fmt(item.paid)}</span>
									<span className="text-muted-foreground">
										/ {fmt(item.total)}
									</span>
									<span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-sm tabular-nums">
										{itemPct.toFixed(0)}%
									</span>
								</div>
							</div>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}
