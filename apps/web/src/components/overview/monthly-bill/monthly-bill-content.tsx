"use client";

import { InstitutionMark } from "@/components/institution-mark";
import { MaskedMonetaryValue } from "@/components/monetary-visibility";
import { OverviewOverflowPanel } from "@/components/overview/shared/overview-overflow-panel";

const fmt = (value: number) =>
	new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
	}).format(value);

type MonthlyBillItem = {
	id?: string;
	name: string;
	provider?: string | null;
	paidAmount: number;
	totalAmount: number;
};

export function MonthlyBillContent({
	totalBill,
	items,
}: {
	totalBill: number;
	items: MonthlyBillItem[];
}) {
	return (
		<div className="@container flex min-h-0 flex-1 flex-col gap-4 sm:gap-6">
			<div className="text-2xl font-semibold tabular-nums sm:text-3xl">
				<MaskedMonetaryValue format={fmt} value={totalBill} />
			</div>

			<OverviewOverflowPanel>
				<div className="flex flex-col gap-5 sm:gap-8">
					{items.map((item) => {
						const itemPct =
							item.totalAmount > 0
								? (item.paidAmount / item.totalAmount) * 100
								: 0;

						return (
							<div
								key={item.id ?? item.name}
								className="flex flex-col items-start gap-2 text-base @min-[560px]:flex-row @min-[560px]:items-center @min-[560px]:justify-between @min-[560px]:gap-4"
							>
								<div className="flex min-w-0 items-center gap-2.5">
									<InstitutionMark
										name={item.name}
										provider={item.provider}
										size="sm"
									/>
									<span className="truncate font-medium">{item.name}</span>
								</div>
								<div className="flex shrink-0 items-center gap-2 tabular-nums text-base sm:text-lg">
									<span>
										<MaskedMonetaryValue format={fmt} value={item.paidAmount} />
									</span>
									<span className="text-muted-foreground">
										/{" "}
										<MaskedMonetaryValue
											format={fmt}
											value={item.totalAmount}
										/>
									</span>
									<span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-sm tabular-nums">
										{itemPct.toFixed(0)}%
									</span>
								</div>
							</div>
						);
					})}
				</div>
			</OverviewOverflowPanel>
		</div>
	);
}
