"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@vault/ui/components/card";
import { AnimatedNumber } from "@/components/animated-number";
import { HomeCardSkeleton } from "@/components/home-card-skeleton";

type MonthlyBillsCardProps = {
	title?: string;
	total?: number;
	installments?: number;
	oneOff?: number;
	limit?: number;
	providerName?: string;
	planName?: string;
	loading?: boolean;
};

function formatCurrency(value: number, locale = "pt-BR", currency = "BRL") {
	return new Intl.NumberFormat(locale, {
		style: "currency",
		currency,
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);
}

export function MonthlyBillsCard({
	title = "Faturas do Mês",
	total = 478.36,
	installments = 41.3,
	oneOff = 395.76,
	limit = 550,
	providerName = "nu",
	planName = "gold",
	loading = false,
}: MonthlyBillsCardProps) {
	if (loading) {
		return <HomeCardSkeleton variant="bills" />;
	}

	const usagePct = limit > 0 ? Math.round((total / limit) * 100) : 0;

	return (
		<Card className="financial-panel-border h-full min-h-[32rem] ring-0">
			<CardHeader className="gap-4">
				<div className="space-y-4">
					<CardDescription className="text-base">{title}</CardDescription>

					<div className="space-y-2">
						<CardTitle className="text-5xl">
							<AnimatedNumber value={total} format={formatCurrency} />
						</CardTitle>
						<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-base text-muted-foreground">
							<span>{formatCurrency(installments)} em parcelas</span>
							<span className="text-white/24">·</span>
							<span>{formatCurrency(oneOff)} avulsos</span>
						</div>
					</div>
				</div>
			</CardHeader>

			<CardContent className="flex h-full flex-col">
				<div className="mt-2 flex items-center justify-between gap-4 border-b border-border pb-5">
					<div className="flex min-w-0 items-center gap-3">
						<div className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold lowercase tracking-tight text-fuchsia-500 [background-image:linear-gradient(180deg,rgba(56,56,60,0.95),rgba(40,40,44,0.95))]">
							{providerName}
						</div>
						<div className="truncate text-xl font-medium text-foreground">
							{planName}
						</div>
					</div>

					<div className="flex items-center gap-3">
						<div className="text-right font-['Space_Grotesk'] text-xl font-medium tracking-tight text-foreground">
							<AnimatedNumber value={total} format={formatCurrency} />{" "}
							<span className="text-muted-foreground">
								/ {formatCurrency(limit)}
							</span>
						</div>
						<div className="rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
							{usagePct}%
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
