"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@vault/ui/components/card";
import { cn } from "@vault/ui/lib/utils";
import { DashboardCardLinkButton } from "@/components/dashboard-card-link-button";
import { HomeCardSkeleton } from "@/components/home-card-skeleton";
import {
	MaskedMonetaryText,
	MaskedMonetaryValue,
} from "@/components/monetary-visibility";

type MonthlyBillsCardProps = {
	title?: string;
	total?: number;
	installments?: number;
	oneOff?: number;
	limit?: number;
	providerName?: string;
	planName?: string;
	loading?: boolean;
	className?: string;
	detailHref?: string;
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
	className,
	detailHref,
}: MonthlyBillsCardProps) {
	if (loading) {
		return <HomeCardSkeleton variant="bills" />;
	}

	const usagePct = limit > 0 ? Math.round((total / limit) * 100) : 0;

	return (
		<Card
			className={cn(
				"financial-panel-border h-full min-h-[32rem] ring-0",
				className,
			)}
		>
			<CardHeader className="gap-4">
				<div className="space-y-4">
					<div className="flex items-start justify-between gap-3">
						<CardDescription className="text-base">{title}</CardDescription>
						{detailHref ? (
							<DashboardCardLinkButton
								label={`Abrir ${title}`}
								to={detailHref}
							/>
						) : null}
					</div>

					<div className="space-y-2">
						<CardTitle className="text-5xl">
							<MaskedMonetaryValue
								animated
								format={formatCurrency}
								value={total}
							/>
						</CardTitle>
						<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-base text-muted-foreground">
							<span>
								<MaskedMonetaryText>
									{formatCurrency(installments)}
								</MaskedMonetaryText>{" "}
								em parcelas
							</span>
							<span className="text-white/24">·</span>
							<span>
								<MaskedMonetaryText>{formatCurrency(oneOff)}</MaskedMonetaryText>{" "}
								avulsos
							</span>
						</div>
					</div>
				</div>
			</CardHeader>

			<CardContent className="flex h-full flex-col">
				<div className="mt-2 flex items-center justify-between gap-4 pb-5">
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
							<MaskedMonetaryValue
								animated
								format={formatCurrency}
								value={total}
							/>{" "}
							<span className="text-muted-foreground">
								/ <MaskedMonetaryText>{formatCurrency(limit)}</MaskedMonetaryText>
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
