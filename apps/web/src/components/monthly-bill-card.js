"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { MonthlyBillCard as OverviewMonthlyBillCard } from "@/components/overview/monthly-bill/monthly-bill-card";
import { getMonthValue } from "@/features/finance/sdk";
export function MonthlyBillCard({ month }) {
    return _jsx(OverviewMonthlyBillCard, { month: month ?? getMonthValue() });
}
