"use client";

import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { DashboardCardLinkButton } from "@/components/dashboard-card-link-button";
import { Delta, DeltaIcon } from "@/components/delta";
import {
	MaskedMonetaryText,
	MaskedMonetaryValue,
} from "@/components/monetary-visibility";
import type { PartialResultMetrics } from "./hooks/use-partial-result";

const currencyFmt = new Intl.NumberFormat("pt-BR", {
	style: "currency",
	currency: "BRL",
});

function formatCurrency(value: number) {
	return currencyFmt.format(value);
}

function formatChangePercent(value: number) {
	const sign = value > 0 ? "+" : "";
	return `${sign}${value.toFixed(1)}%`;
}

type PartialResultContentProps = {
	metrics: PartialResultMetrics;
	/** Hide the overview link when the card is already on /transactions. */
	showLink?: boolean;
};

export function PartialResultContent({
	metrics,
	showLink = true,
}: PartialResultContentProps) {
	const { income, spent, result, previousResult, changePercent } = metrics;

	return (
		<div className="flex h-full min-h-0 w-full flex-col justify-between gap-4">
			<div className="space-y-3">
				<div className="flex items-start justify-between gap-2">
					<p className="text-sm text-muted-foreground">Resultado Parcial</p>
					{showLink ? (
						<DashboardCardLinkButton
							label="Abrir transações"
							to="/transactions"
						/>
					) : null}
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<span className="text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
						<MaskedMonetaryValue format={formatCurrency} value={result} />
					</span>
					{changePercent != null ? (
						<Delta
							className="rounded-full px-1.5 py-0.5 text-xs font-medium"
							value={changePercent}
							variant="badge"
						>
							<DeltaIcon className="size-3" filled />
							<span className="tabular-nums">
								{formatChangePercent(changePercent)}
							</span>
						</Delta>
					) : null}
				</div>

				<p className="text-sm text-muted-foreground">
					vs{" "}
					<MaskedMonetaryText>
						{formatCurrency(previousResult)}
					</MaskedMonetaryText>{" "}
					mês anterior
				</p>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-1">
					<div className="flex items-center gap-1.5 text-sm text-emerald-500">
						<ChevronDownIcon
							aria-hidden
							className="size-3.5 fill-current stroke-current"
						/>
						<span>Receita</span>
					</div>
					<p className="text-base font-medium tracking-tight tabular-nums sm:text-lg">
						<MaskedMonetaryValue format={formatCurrency} value={income} />
					</p>
				</div>

				<div className="space-y-1">
					<div className="flex items-center gap-1.5 text-sm text-rose-500">
						<ChevronUpIcon
							aria-hidden
							className="size-3.5 fill-current stroke-current"
						/>
						<span>Gasto</span>
					</div>
					<p className="text-base font-medium tracking-tight tabular-nums sm:text-lg">
						<MaskedMonetaryValue format={formatCurrency} value={spent} />
					</p>
				</div>
			</div>
		</div>
	);
}
