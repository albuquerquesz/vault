"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@vault/ui/components/card";
import { cn } from "@vault/ui/lib/utils";
import { ArrowUpRightIcon, SparklesIcon } from "lucide-react";

type MonthlyBillsCardProps = {
	title?: string;
	total?: number;
	installments?: number;
	oneOff?: number;
	limit?: number;
	providerName?: string;
	planName?: string;
	ctaTitle?: string;
	ctaDescription?: string;
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
	ctaTitle = "Veja todas as suas faturas",
	ctaDescription = "Assine o Pro para acompanhar todas as faturas",
}: MonthlyBillsCardProps) {
	const usagePct = limit > 0 ? Math.round((total / limit) * 100) : 0;

	return (
		<Card className="financial-panel-border h-full min-h-[32rem] ring-0">
			<CardHeader className="gap-4">
				<div className="space-y-4">
					<CardDescription className="text-base">{title}</CardDescription>

					<div className="space-y-2">
						<CardTitle className="text-5xl">{formatCurrency(total)}</CardTitle>
						<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-base text-muted-foreground">
							<span>{formatCurrency(installments)} em parcelas</span>
							<span className="text-white/24">·</span>
							<span>{formatCurrency(oneOff)} avulsos</span>
						</div>
					</div>
				</div>
			</CardHeader>

			<CardContent className="flex h-full flex-col">
				<div className="mt-2 flex items-center justify-between gap-4">
					<div className="flex min-w-0 items-center gap-3">
						<div className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold lowercase tracking-tight text-fuchsia-500 [background-image:linear-gradient(180deg,rgba(56,56,60,0.95),rgba(40,40,44,0.95))]">
							{providerName}
						</div>
						<div className="truncate text-[1.75rem] font-medium text-foreground">
							{planName}
						</div>
					</div>

					<div className="flex items-center gap-3">
						<div className="text-right font-['Space_Grotesk'] text-2xl font-medium tracking-tight text-foreground">
							{formatCurrency(total)}{" "}
							<span className="text-muted-foreground">
								/ {formatCurrency(limit)}
							</span>
						</div>
						<div className="rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
							{usagePct}%
						</div>
					</div>
				</div>

				<div className="mt-8 h-px w-full bg-border" />

				<a
					href="#/billing"
					className={cn(
						"mt-8 flex items-center gap-4 rounded-[1.35rem] px-5 py-4 transition-transform duration-200 hover:-translate-y-0.5",
						"[background-image:linear-gradient(135deg,rgba(23,31,58,0.98),rgba(22,50,58,0.98))]",
					)}
				>
					<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-[0_6px_24px_rgba(20,147,255,0.35)] [background-image:linear-gradient(135deg,#2ad1ff,#0c77ff)]">
						<SparklesIcon className="size-5" aria-hidden="true" />
					</div>
					<div className="min-w-0 flex-1">
						<div className="text-xl font-semibold tracking-tight text-white">
							{ctaTitle}
						</div>
						<div className="mt-1 text-base leading-6 text-white/56">
							{ctaDescription}
						</div>
					</div>
					<ArrowUpRightIcon
						className="size-5 shrink-0 text-[#2f7bff]"
						aria-hidden="true"
					/>
				</a>
			</CardContent>
		</Card>
	);
}
