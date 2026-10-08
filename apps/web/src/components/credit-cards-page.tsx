"use client";

import { useMemo, useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@vault/ui/components/card";
import { MonthlyBillList, formatMonthlyBillCurrency } from "@/components/overview/monthly-bill/monthly-bill-content";
import { buildFinanceMonthOptions } from "@/components/shared/finance-month-options";
import { FinanceMonthSelect } from "@/components/shared/finance-month-select";
import { useMonthlyBillCard } from "@/components/overview/monthly-bill/hooks/use-monthly-bill-card";
import { MaskedMonetaryValue } from "@/components/monetary-visibility";
import { getMonthValue } from "@/features/finance/sdk";

export function CreditCardsPage({
	initialMonth,
}: {
	initialMonth: string;
}) {
	const [month, setMonth] = useState(initialMonth);
	const monthOptions = useMemo(() => buildFinanceMonthOptions(), []);
	const { bill, isError, isLoading, items } = useMonthlyBillCard(month);

	return (
		<div className="grid min-w-0 gap-4 py-4 sm:gap-6 sm:py-6">
			<header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div className="space-y-2">
					<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
						Cartões
					</h1>
					<p className="max-w-[65ch] text-sm text-muted-foreground sm:text-base">
						Acompanhe todas as faturas e pagamentos do mês.
					</p>
				</div>
				<FinanceMonthSelect
					value={month}
					options={monthOptions}
					onValueChange={setMonth}
				/>
			</header>

			<Card className="financial-panel-border ring-0">
				<CardHeader className="p-4 sm:p-6">
					<CardTitle className="text-xl sm:text-2xl">Faturas</CardTitle>
					<CardDescription>
						Faturas do mês ordenadas pelo maior valor.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-5 p-4 sm:p-6">
					{isLoading ? (
						<p className="text-sm text-muted-foreground">Carregando faturas…</p>
					) : isError ? (
						<p className="text-sm text-destructive">
							Não foi possível carregar as faturas.
						</p>
					) : items.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							Nenhuma fatura encontrada para este mês.
						</p>
					) : (
						<>
							<div>
								<p className="text-xs text-muted-foreground">Total das faturas</p>
								<p className="text-2xl font-medium tabular-nums sm:text-3xl">
									<MaskedMonetaryValue
										format={formatMonthlyBillCurrency}
										value={bill?.totalBill ?? 0}
									/>
								</p>
							</div>
							<MonthlyBillList items={items} />
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
