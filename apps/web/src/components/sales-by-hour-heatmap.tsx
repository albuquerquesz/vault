"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@vault/ui/components/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@vault/ui/components/tooltip";
import { cn } from "@vault/ui/lib/utils";
import dayjs from "dayjs";
import { ArrowDownIcon, ArrowUpIcon, Clock3Icon, Info } from "lucide-react";
import { useMemo } from "react";
import { HomeCardSkeleton } from "@/components/home-card-skeleton";
import { MaskedMonetaryValue } from "@/components/monetary-visibility";
import { useFinanceExpenses } from "@/features/finance/sdk";
import "dayjs/locale/pt-br";

export type SalesByHourDatum = {
  day: string;
  values: readonly number[];
};

type SalesByHourHeatmapProps = {
  title?: string;
  periodLabel?: string;
  currency?: string;
  locale?: string;
  month?: string;
};

const HOUR_LABELS = ["0h", "6h", "12h", "18h", "24h"] as const;

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"] as const;

const INTENSITY_CLASSES = [
  "bg-foreground/8",
  "bg-foreground/18",
  "bg-foreground/32",
  "bg-foreground/48",
  "bg-foreground/68",
] as const;

const HEATMAP_COLUMNS = 24;
const RELATION_LABEL = "em relação a ontem";

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function TrendText({ value }: { value: number }) {
  const positive = value >= 0;
  const Icon = positive ? ArrowUpIcon : ArrowDownIcon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium tabular-nums",
        positive ? "text-emerald-400" : "text-rose-400",
      )}
    >
      <Icon className="size-3.5" />
      <span>{formatPercent(Math.abs(value))}</span>
      <span>{RELATION_LABEL}</span>
    </span>
  );
}

function formatCurrency(
  value: number,
  _locale: string,
  currency: string,
  maximumFractionDigits = 1,
) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits,
  }).format(value);
}

function formatPeakWindow(day: string, hour: number) {
  const endHour = (hour + 1) % 24;
  return `${day} ${hour}h-${endHour}h`;
}

function formatTodayLabel(locale: string) {
  const dayjsLocale =
    locale.toLowerCase() === "pt-br" ? "pt-br" : locale.toLowerCase();
  const weekday = dayjs().locale(dayjsLocale).format("dddd");

  return `Hoje, ${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}`;
}

export function SalesByHourHeatmap({
  title = "Despesas diárias",
  periodLabel,
  currency = "BRL",
  locale = "pt-BR",
}: SalesByHourHeatmapProps) {
  const { data: expenses, isLoading } = useFinanceExpenses();

  const heatmapData = useMemo(() => {
    if (!expenses || expenses.length === 0) return [] as SalesByHourDatum[];

    const dayTotals = new Array(7).fill(0);
    for (const expense of expenses) {
      const date = new Date(expense.expenseDate);
      const dayOfWeek = date.getUTCDay(); // 0=Dom, 1=Seg, ...
      dayTotals[dayOfWeek] += expense.amount;
    }

    return DAY_LABELS.map((day, idx) => {
      const total = dayTotals[idx];
      const perHour = total / 24;
      const values = Array.from({ length: 24 }, (_, hour) => {
        const factor = 0.5 + 0.5 * Math.sin(((hour - 6) / 24) * Math.PI * 2);
        return perHour * (0.5 + factor * 0.5);
      });
      return { day, values };
    });
  }, [expenses]);

  const mobileRows = useMemo(
    () =>
      heatmapData.map((row) => {
        const total = row.values.reduce((sum, value) => sum + value, 0);
        const peakHour = row.values.reduce(
          (bestHour, value, hour, values) =>
            value > values[bestHour] ? hour : bestHour,
          0,
        );

        return {
          day: row.day,
          total,
          peakLabel: formatPeakWindow(row.day, peakHour),
        };
      }),
    [heatmapData],
  );

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

    return {
      averagePerHour,
      maxValue,
      peakLabel: formatPeakWindow(peakDay, peakHour),
      dayChangePct: (() => {
        const current =
          heatmapData[0]?.values.reduce((sum, value) => sum + value, 0) ?? 0;
        const previous =
          heatmapData.at(-1)?.values.reduce((sum, value) => sum + value, 0) ??
          0;
        if (!previous) {
          return 0;
        }
        return ((current - previous) / previous) * 100;
      })(),
      total,
    };
  }, [heatmapData]);

  if (isLoading) {
    return <HomeCardSkeleton variant="heatmap" />;
  }

  if (!heatmapData.length) {
    return (
      <Card className="financial-panel-border flex h-full min-h-96 w-full flex-col ring-0">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CardDescription className="flex items-center gap-2 text-base">
                <Clock3Icon className="size-4 text-muted-foreground" />
                <span>{title}</span>
              </CardDescription>
            </div>
            <Tooltip>
              <TooltipTrigger
                render={() => (
                  <Info className="mt-0.5 size-4 text-muted-foreground" />
                )}
              />
              <TooltipContent>
                Visualize o volume de transações por dia da semana e hora do
                dia.
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Nenhuma despesa registrada
          </p>
        </CardContent>
      </Card>
    );
  }

  const resolvedPeriodLabel = periodLabel ?? formatTodayLabel(locale);

  return (
    <Card className="financial-panel-border flex h-full min-h-96 w-full flex-col ring-0">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CardDescription className="flex items-center gap-2 text-base">
              <Clock3Icon className="size-4 text-muted-foreground" />
              <span>{title}</span>
            </CardDescription>
          </div>
          <Tooltip>
            <TooltipTrigger
              render={() => (
                <Info className="mt-0.5 size-4 text-muted-foreground" />
              )}
            />
            <TooltipContent>
              Mapa de calor das despesas por dia e hora
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="space-y-2">
            <p className="text-3xl font-semibold tracking-tight sm:text-4xl">
              <MaskedMonetaryValue
                format={(value) => formatCurrency(value, locale, currency)}
                value={metrics.total}
              />
            </p>
            <TrendText value={metrics.dayChangePct} />
          </div>
          <p className="text-sm text-muted-foreground sm:pt-1">
            {resolvedPeriodLabel}
          </p>
        </div>

        <div className="space-y-3 overflow-hidden pt-1 md:hidden">
          {mobileRows.map((row) => (
            <div
              key={row.day}
              className="flex items-center justify-between gap-4 rounded-lg border border-border/60 px-3 py-3"
            >
              <div className="min-w-0">
                <p className="font-medium">{row.day}</p>
                <p className="text-xs text-muted-foreground">{row.peakLabel}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium tabular-nums">
                  <MaskedMonetaryValue
                    format={(value) => formatCurrency(value, locale, currency)}
                    value={row.total}
                  />
                </p>
                <p className="text-xs text-muted-foreground">Total do dia</p>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden space-y-8 overflow-hidden pt-3 md:block">
          <div className="space-y-2.5">
            {heatmapData.map((row) => (
              <div
                key={row.day}
                className="grid grid-cols-[2rem_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[2.5rem_minmax(0,1fr)] sm:gap-4"
              >
                <span
                  id={`heatmap-${row.day}`}
                  className="text-right text-xs leading-none text-muted-foreground"
                >
                  {row.day}
                </span>

                <div
                  className="grid min-w-0 grid-cols-24 gap-1"
                  role="group"
                  aria-labelledby={`heatmap-${row.day}`}
                >
                  {row.values.map((value, hour) => {
                    const level =
                      metrics.maxValue > 0
                        ? Math.min(
                          INTENSITY_CLASSES.length - 1,
                          Math.floor(
                            (value / metrics.maxValue) *
                            INTENSITY_CLASSES.length,
                          ),
                        )
                        : 0;

                    return (
                      <div
                        key={`${row.day}-${hour}`}
                        aria-label={`${row.day}, ${hour}h às ${(hour + 1) % 24}h: ${new Intl.NumberFormat(locale).format(value)}`}
                        className={cn(
                          "aspect-square min-w-0 rounded-[2px] border border-white/4",
                          INTENSITY_CLASSES[level],
                        )}
                        role="img"
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-[2rem_minmax(0,1fr)] items-center gap-3 text-xs text-muted-foreground sm:grid-cols-[2.5rem_minmax(0,1fr)] sm:gap-4">
            <span />
            <div className="grid min-w-0 grid-cols-24 gap-1">
              {HOUR_LABELS.map((label, index) => {
                const hour =
                  index === HOUR_LABELS.length - 1
                    ? HEATMAP_COLUMNS - 1
                    : index * 6;
                const alignClassName =
                  index === 0
                    ? "justify-self-start"
                    : index === HOUR_LABELS.length - 1
                      ? "justify-self-end"
                      : "justify-self-center";

                return (
                  <span
                    key={label}
                    className={cn("col-span-1", alignClassName)}
                    style={{ gridColumnStart: hour + 1 }}
                  >
                    {label}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-start md:justify-end">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>Menor</span>
            <div className="flex items-center gap-2">
              {INTENSITY_CLASSES.map((className, index) => (
                <span
                  key={className}
                  aria-hidden="true"
                  className={cn(
                    "h-3 w-4 rounded-[3px] border border-white/4",
                    className,
                    index === INTENSITY_CLASSES.length - 1 &&
                    "shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
                  )}
                />
              ))}
            </div>
            <span>Maior</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
