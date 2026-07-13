"use client";

import { getMonthValue } from "@/features/finance/sdk";
import { MonthlyBillCard as OverviewMonthlyBillCard } from "@/components/overview/monthly-bill/monthly-bill-card";

export function MonthlyBillCard({ month }: { month?: string }) {
	return <OverviewMonthlyBillCard month={month ?? getMonthValue()} />;
}
