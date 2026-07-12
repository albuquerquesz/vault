"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@vault/ui/components/select";
import { CalendarIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { GoalsCard } from "@/components/goals-card";
import { MonthlyBillCard } from "@/components/monthly-bill-card";
import { OrderSourceMixChart } from "@/components/order-source-mix-chart";
import { RecentTransactionsTable } from "@/components/recent-transactions-table";
import { SalesByHourHeatmap } from "@/components/sales-by-hour-heatmap";
import { getMonthValue } from "@/features/finance/sdk";
import { authClient } from "@/lib/auth-client";

type MonthOption = {
	value: string;
	label: string;
};

function generateMonthOptions(count = 6): MonthOption[] {
	const now = new Date();
	const options: MonthOption[] = [];
	for (let i = 0; i < count; i++) {
		const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
		const value = getMonthValue(d);
		const label = d.toLocaleDateString("pt-BR", {
			month: "long",
			year: "numeric",
		});
		options.push({
			value,
			label: label.charAt(0).toUpperCase() + label.slice(1),
		});
	}
	return options;
}

export function Dashboard() {
	const { data: session } = authClient.useSession();
	const firstName = session?.user.name?.split(" ")[0] ?? "";
	const [selectedMonth, setSelectedMonth] = useState(getMonthValue());
	const monthOptions = useMemo(() => generateMonthOptions(6), []);

	return (
		<div className="grid grid-cols-1 gap-4 pt-6">
			<div className="mb-2 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center sm:mb-6">
				<h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl xl:text-4xl">
					Bem-vindo de volta{firstName ? `, ${firstName}!` : "!"} 👋
				</h2>
				<Select
					value={selectedMonth}
					onValueChange={(v) => v && setSelectedMonth(v)}
				>
					<SelectTrigger className="h-9 w-[160px] text-sm">
						<CalendarIcon className="mr-2 size-3.5 text-muted-foreground" />
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{monthOptions.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
				<OrderSourceMixChart />
				<MonthlyBillCard month={selectedMonth} />
			</div>
			<div className="grid grid-cols-1 gap-4 xl:grid-cols-10">
				<div className="xl:col-span-3">
					<SalesByHourHeatmap month={selectedMonth} />
				</div>
				<div className="xl:col-span-3">
					<GoalsCard />
				</div>
				<div className="xl:col-span-4">
					<RecentTransactionsTable />
				</div>
			</div>
		</div>
	);
}
