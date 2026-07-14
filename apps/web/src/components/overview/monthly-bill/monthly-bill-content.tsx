"use client";

import { InstitutionMark } from "@/components/institution-mark";

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
		<div className="flex flex-1 flex-col gap-4 sm:gap-6">
			<div className="text-2xl font-semibold tabular-nums sm:text-3xl">
				{fmt(totalBill)}
			</div>

			<div className="flex flex-col gap-5 sm:gap-8">
				{items.map((item) => {
					const itemPct =
						item.totalAmount > 0
							? (item.paidAmount / item.totalAmount) * 100
							: 0;

					return (
						<div
							key={item.id ?? item.name}
							className="flex flex-col items-start gap-2 text-base sm:flex-row sm:items-center sm:justify-between sm:gap-4"
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
		</div>
	);
}
