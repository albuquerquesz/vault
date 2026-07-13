"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { OrderSourceMixCard } from "@/components/overview/order-source-mix/order-source-mix-card";
import { getMonthValue } from "@/features/finance/sdk";
export function OrderSourceMixChart({ title, month, }) {
    return _jsx(OrderSourceMixCard, { month: month ?? getMonthValue(), title: title });
}
