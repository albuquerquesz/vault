"use client";

import { InstitutionMark } from "@/components/institution-mark";
import { MaskedMonetaryValue } from "@/components/monetary-visibility";
import { OverviewOverflowPanel } from "@/components/overview/shared/overview-overflow-panel";

export const formatMonthlyBillCurrency = (value: number) =>
	new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
	}).format(value);

export type MonthlyBillItem = {
	id?: string;
	name: string;
	provider?: string | null;
	availableAmount?: number | null;
	paidAmount: number;
	totalAmount: number;
};

function getPaymentStatus(paidAmount: number, totalAmount: number) {
	if (totalAmount > 0 && paidAmount >= totalAmount - 0.01) {
		return {
			label: "Fatura paga",
			className:
				"bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
		};
	}
	if (paidAmount > 0) {
		return {
			label: "Pagamento parcial",
			className:
				"bg-amber-500/10 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
		};
	}
	return {
		label: "Fatura em aberto",
		className:
			"bg-orange-500/10 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300",
	};
}

export function MonthlyBillTile({ item }: { item: MonthlyBillItem }) {
	const status = getPaymentStatus(item.paidAmount, item.totalAmount);

	return (
		<article className="@container flex min-h-36 flex-col justify-between gap-2 rounded-[18px] bg-background p-3 text-card-foreground dark:bg-secondary">
			<div className="flex min-w-0 items-center justify-between gap-3">
				<div className="flex min-w-0 items-center gap-2.5">
					<div
						aria-hidden="true"
						className="relative flex h-10 w-8 shrink-0 flex-col justify-between overflow-hidden rounded-md border border-white/10 bg-gradient-to-br from-zinc-500 to-zinc-900 p-1 shadow-inner"
					>
						<span className="h-2 w-2.5 rounded-[2px] border border-white/30 bg-amber-100/80 shadow-sm" />
						<InstitutionMark
							name={item.name}
							provider={item.provider}
							size="sm"
							className="size-3.5 rounded-[3px] text-[6px]"
						/>
					</div>
					<p className="min-w-0 truncate text-base font-semibold text-card-foreground sm:text-lg">
						{item.name}
					</p>
				</div>

				<span
					className={`shrink-0 rounded-md px-2.5 py-1 text-xs leading-tight font-medium sm:text-sm ${status.className}`}
				>
					{status.label}
				</span>
			</div>

			<div className="flex min-w-0 items-end justify-between gap-3">
				<div className="flex min-w-0 flex-col items-start gap-2">
					<p className="truncate text-xl leading-none font-medium tracking-tight tabular-nums sm:text-2xl">
						<MaskedMonetaryValue
							format={formatMonthlyBillCurrency}
							value={item.totalAmount}
						/>
					</p>
					{item.paidAmount > 0 ? (
						<p className="text-sm text-muted-foreground tabular-nums">
							<MaskedMonetaryValue
								format={formatMonthlyBillCurrency}
								value={item.paidAmount}
							/>{" "}
							pago
						</p>
					) : null}
				</div>
				{item.availableAmount != null && Number.isFinite(item.availableAmount) ? (
					<p className="shrink-0 text-right text-xs text-muted-foreground tabular-nums sm:text-sm">
						<MaskedMonetaryValue
							format={formatMonthlyBillCurrency}
							value={item.availableAmount}
						/>{" "}
						disponível
					</p>
				) : null}
			</div>
		</article>
	);
}

export function MonthlyBillList({
	items,
}: {
	items: MonthlyBillItem[];
}) {
	return (
		<div className="flex flex-col gap-3">
			{items.map((item) => (
				<MonthlyBillTile key={item.id ?? item.name} item={item} />
			))}
		</div>
	);
}

export function MonthlyBillContent({
	totalBill,
	items,
}: {
	totalBill: number;
	items: MonthlyBillItem[];
}) {
	const topItems = [...items]
		.sort((left, right) => right.totalAmount - left.totalAmount)
		.slice(0, 2);
	return (
		<div className="@container flex min-h-0 flex-1 flex-col gap-3">
			<div className="shrink-0">
				<p className="text-xs text-muted-foreground">Total das faturas</p>
				<p className="text-2xl font-sans font-medium tabular-nums sm:text-3xl">
					<MaskedMonetaryValue
						format={formatMonthlyBillCurrency}
						value={totalBill}
					/>
				</p>
			</div>

			<OverviewOverflowPanel
				reserveFooterSpace={false}
				scrollable={false}
			>
				<MonthlyBillList items={topItems} />
			</OverviewOverflowPanel>
		</div>
	);
}
