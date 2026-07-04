"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
} from "@vault/ui/components/card";
import { ArrowUpRight, CreditCardIcon } from "lucide-react";

type MonthlyBillCardProps = {
	totalBill?: number;
	paidAmount?: number;
	remainingAmount?: number;
	detailHref?: string;
	title?: string;
};

export function MonthlyBillCard({
	totalBill = 1250,
	paidAmount = 750,
	remainingAmount = 500,
	detailHref,
	title = "Fatura do mês",
}: MonthlyBillCardProps) {
	const percentage = totalBill > 0 ? (paidAmount / totalBill) * 100 : 0;

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
				<div>
					<div className="text-3xl font-semibold tabular-nums">
						{new Intl.NumberFormat("pt-BR", {
							style: "currency",
							currency: "BRL",
							maximumFractionDigits: 0,
						}).format(totalBill)}
					</div>
					<div className="text-muted-foreground text-sm">Total da fatura</div>
				</div>

				<div className="space-y-3">
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">Pago</span>
						<span className="font-medium tabular-nums text-emerald-500">
							{new Intl.NumberFormat("pt-BR", {
								style: "currency",
								currency: "BRL",
								maximumFractionDigits: 0,
							}).format(paidAmount)}
						</span>
					</div>

					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">Restante</span>
						<span className="font-medium tabular-nums text-rose-500">
							{new Intl.NumberFormat("pt-BR", {
								style: "currency",
								currency: "BRL",
								maximumFractionDigits: 0,
							}).format(remainingAmount)}
						</span>
					</div>

					<div className="h-2 overflow-hidden rounded-full bg-muted">
						<div
							className="h-full bg-foreground/80 transition-all"
							style={{ width: `${percentage}%` }}
						/>
					</div>
					<div className="text-right text-muted-foreground text-xs tabular-nums">
						{percentage.toFixed(0)}% pago
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
