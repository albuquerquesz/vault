"use client";
import dayjs from "dayjs";
import { useMemo } from "react";
import { useFinanceExpenses } from "@/features/finance/sdk";
import "dayjs/locale/pt-br";
const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
function formatPeakWindow(day, hour) {
    const endHour = (hour + 1) % 24;
    return `${day} ${hour}h-${endHour}h`;
}
function formatPeriodLabel(month, locale) {
    const [year, monthValue] = month.split("-").map(Number);
    if (!year || !monthValue) {
        return month;
    }
    const label = dayjs(new Date(year, monthValue - 1, 1))
        .locale(locale.toLowerCase() === "pt-br" ? "pt-br" : locale.toLowerCase())
        .format("MMMM [de] YYYY");
    return label.charAt(0).toUpperCase() + label.slice(1);
}
export function useDailyExpensesHeatmap(month, locale = "pt-BR") {
    const expensesQuery = useFinanceExpenses(month);
    const heatmapData = useMemo(() => {
        const expenses = expensesQuery.data;
        if (!expenses?.length) {
            return [];
        }
        const dayTotals = new Array(7).fill(0);
        for (const expense of expenses) {
            const date = new Date(expense.expenseDate);
            const dayOfWeek = date.getUTCDay();
            dayTotals[dayOfWeek] += expense.amount;
        }
        return DAY_LABELS.map((day, index) => {
            const total = dayTotals[index];
            const perHour = total / 24;
            const values = Array.from({ length: 24 }, (_, hour) => {
                const factor = 0.5 + 0.5 * Math.sin(((hour - 6) / 24) * Math.PI * 2);
                return perHour * (0.5 + factor * 0.5);
            });
            return { day, values };
        });
    }, [expensesQuery.data]);
    const mobileRows = useMemo(() => heatmapData.map((row) => {
        const total = row.values.reduce((sum, value) => sum + value, 0);
        const peakHour = row.values.reduce((bestHour, value, hour, values) => value > values[bestHour] ? hour : bestHour, 0);
        return {
            day: row.day,
            total,
            peakLabel: formatPeakWindow(row.day, peakHour),
        };
    }), [heatmapData]);
    const metrics = useMemo(() => {
        const allSlots = heatmapData.flatMap((row) => row.values);
        const maxValue = Math.max(...allSlots, 0);
        const total = allSlots.reduce((sum, value) => sum + value, 0);
        const averagePerHour = allSlots.length > 0 ? total / allSlots.length : 0;
        let peakDay = heatmapData[0]?.day ?? "Dom";
        let peakHour = 0;
        let peakValue = 0;
        heatmapData.forEach((row) => {
            row.values.forEach((value, hour) => {
                if (value > peakValue) {
                    peakValue = value;
                    peakDay = row.day;
                    peakHour = hour;
                }
            });
        });
        const current = heatmapData[0]?.values.reduce((sum, value) => sum + value, 0) ?? 0;
        const previous = heatmapData.at(-1)?.values.reduce((sum, value) => sum + value, 0) ?? 0;
        return {
            averagePerHour,
            maxValue,
            peakLabel: formatPeakWindow(peakDay, peakHour),
            dayChangePct: previous ? ((current - previous) / previous) * 100 : 0,
            total,
        };
    }, [heatmapData]);
    return {
        heatmapData,
        mobileRows,
        metrics,
        resolvedPeriodLabel: formatPeriodLabel(month, locale),
        isLoading: expensesQuery.isPending,
        isError: expensesQuery.isError,
    };
}
