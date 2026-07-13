"use client";

import { MonthlyBillCard as OverviewMonthlyBillCard } from "@/components/overview/monthly-bill/monthly-bill-card";
import { getMonthValue } from "@/features/finance/sdk";

export function MonthlyBillCard({ month }: { month?: string }) {
	return <OverviewMonthlyBillCard month={month ?? getMonthValue()} />;
}
