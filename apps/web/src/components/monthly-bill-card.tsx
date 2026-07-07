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
import { CreditCardIcon, Info } from "lucide-react";
import { HomeCardSkeleton } from "@/components/home-card-skeleton";
import { getMonthValue, useFinanceMonthlyBills } from "@/features/finance/sdk";

const fmt = (value: number) =>
	new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
	}).format(value);

export function MonthlyBillCard() {
	const month = getMonthValue();
	const billsQuery = useFinanceMonthlyBills(month);

	if (billsQuery.isPending) {
		return <HomeCardSkeleton variant="bills" />;
	}

	if (billsQuery.isError) {
		return (
			<Card className="financial-panel-border h-full min-h-[24rem] w-full ring-0">
				<CardHeader className="border-b">
					<div className="flex items-center justify-between gap-2">
						<div className="flex items-center gap-2">
							<CreditCardIcon className="size-4 text-muted-foreground" />
							<CardDescription className="text-base">
								Faturas do mês
							</CardDescription>
						</div>
						<Tooltip>
							<TooltipTrigger
								render={<Info className="size-4 text-muted-foreground" />}
							/>
							<TooltipContent>Resumo das faturas e pagamentos do mês</TooltipContent>
						</Tooltip>
					</div>
				</CardHeader>
				<CardContent className="py-6 text-sm text-muted-foreground">
					Não foi possível carregar as faturas do mês.
				</CardContent>
			</Card>
		);
	}

	const bills = billsQuery.data;

	if (!bills) {
		return null;
	}

	if (bills.bills.length === 0) {
		return (
			<Card className="financial-panel-border h-full min-h-[24rem] w-full ring-0">
				<CardHeader className="border-b">
					<div className="flex items-center justify-between gap-2">
						<div className="flex items-center gap-2">
							<CreditCardIcon className="size-4 text-muted-foreground" />
							<CardDescription className="text-base">
								Faturas do mês
							</CardDescription>
						</div>
						<Tooltip>
							<TooltipTrigger
								render={<Info className="size-4 text-muted-foreground" />}
							/>
							<TooltipContent>Resumo das faturas e pagamentos do mês</TooltipContent>
						</Tooltip>
					</div>
				</CardHeader>
				<CardContent className="py-6 text-sm text-muted-foreground">
					Nenhuma fatura registrada.
				</CardContent>
			</Card>
		);
	}

	const bill = bills.bills[0];
	const items = bills.items;

	return (
		<Card className="financial-panel-border h-full min-h-[24rem] w-full ring-0">
			<CardHeader className="border-b">
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-2">
						<CreditCardIcon className="size-4 text-muted-foreground" />
						<CardDescription className="text-base">
							Faturas do mês
						</CardDescription>
					</div>
					<Tooltip>
						<TooltipTrigger
							render={<Info className="size-4 text-muted-foreground" />}
						/>
						<TooltipContent>Resumo das faturas e pagamentos do mês</TooltipContent>
					</Tooltip>
				</div>
			</CardHeader>
			<CardContent className="flex flex-col gap-6">
				<div className="text-3xl font-semibold tabular-nums">
					{bill ? fmt(bill.totalBill) : fmt(0)}
				</div>

				<div className="space-y-8">
					{items.map((item) => {
						const itemPct =
							item.totalAmount > 0
								? (item.paidAmount / item.totalAmount) * 100
								: 0;

						return (
							<div
								key={item.name}
								className="flex items-center justify-between gap-4 text-base"
							>
								<div className="flex items-center gap-2">
									<div className="flex size-7 items-center justify-center rounded bg-foreground/10 text-sm font-medium text-foreground">
										{item.name[0]?.toLowerCase() ?? "?"}
									</div>
									<span className="font-medium">{item.name}</span>
								</div>
								<div className="flex items-center gap-2 tabular-nums text-lg">
									<span>{fmt(item.paidAmount)}</span>
									<span className="text-muted-foreground">
										/ {fmt(item.totalAmount)}
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
