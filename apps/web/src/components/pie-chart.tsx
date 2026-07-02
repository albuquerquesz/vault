"use client";

import { type ChartConfig, ChartContainer } from "@vault/ui/components/chart";
import { cn } from "@vault/ui/lib/utils";
import { Cell, Pie, PieChart as RechartsPieChart } from "recharts";

export const slicePalette = [
  "color-mix(in oklab, var(--foreground) 35%, transparent)",
  "color-mix(in oklab, var(--foreground) 28%, transparent)",
  "color-mix(in oklab, var(--foreground) 22%, transparent)",
  "color-mix(in oklab, var(--foreground) 16%, transparent)",
  "color-mix(in oklab, var(--foreground) 10%, transparent)",
] as const;

const chartConfig = {
  orders: {
    label: "Pedidos",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

type PieChartProps = {
  data: readonly { source: string; orders: number }[];
  className?: string;
};

export function PieChart({ data, className }: PieChartProps) {
  return (
    <ChartContainer
      className={cn("h-[28rem] w-full lg:h-[24rem]", className)}
      config={chartConfig}
    >
      <RechartsPieChart accessibilityLayer>
        <Pie
          cx="50%"
          cy="50%"
          data={data}
          dataKey="orders"
          innerRadius={0}
          nameKey="source"
          outerRadius="90%"
          paddingAngle={0}
          stroke="var(--background)"
          strokeWidth={1}
        >
          {data.map((entry, index) => (
            <Cell
              key={entry.source}
              fill={slicePalette[index % slicePalette.length]}
            />
          ))}
        </Pie>
      </RechartsPieChart>
    </ChartContainer>
  );
}