"use client";

import { OrderSourceMixCard } from "@/components/overview/order-source-mix/order-source-mix-card";
import { getMonthValue } from "@/features/finance/sdk";

type OrderSourceMixChartProps = {
	title?: string;
	month?: string;
};

export function OrderSourceMixChart({
	title,
	month,
}: OrderSourceMixChartProps) {
	return <OrderSourceMixCard month={month ?? getMonthValue()} title={title} />;
}
