"use client";

const fmt = (value: number) =>
	new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
	}).format(value);

type MonthlyBillItem = {
	name: string;
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
		<div className="flex flex-1 flex-col gap-6">
			<div className="text-3xl font-semibold tabular-nums">{fmt(totalBill)}</div>

			<div className="space-y-8">
				{items.map((item) => {
					const itemPct =
						item.totalAmount > 0 ? (item.paidAmount / item.totalAmount) * 100 : 0;

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
		</div>
	);
}
