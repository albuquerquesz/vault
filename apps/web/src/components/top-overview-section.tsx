"use client";

import { Card, CardContent, CardHeader } from "@vault/ui/components/card";
import { cn } from "@vault/ui/lib/utils";
import {
  CreditCardIcon,
  ReceiptTextIcon,
  ScaleIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletIcon,
} from "lucide-react";
import { AnimatedNumber } from "@/components/animated-number";

type SummaryCard = {
  title: string;
  value: number;
  description: string;
  change: number;
  icon: React.ReactNode;
  format: (value: number) => string;
  bars: readonly number[];
};

const summaryCards: SummaryCard[] = [
  {
    title: "Saídas do mês",
    value: 284_920,
    description: "8.2% vs últimos 30 dias",
    change: 8.2,
    icon: <WalletIcon className="size-3.5" />,
    format: formatCompactCurrency,
    bars: [5, 8, 11, 14, 10, 12, 9],
  },
  {
    title: "Lançamentos",
    value: 1_842,
    description: "4.1% vs últimos 30 dias",
    change: 4.1,
    icon: <ReceiptTextIcon className="size-3.5" />,
    format: formatInteger,
    bars: [7, 10, 13, 11, 12, 14, 10],
  },
  {
    title: "Ticket médio",
    value: 154.6,
    description: "1.3% vs últimos 30 dias",
    change: -1.3,
    icon: <CreditCardIcon className="size-3.5" />,
    format: formatCurrency,
    bars: [11, 12, 10, 9, 13, 8, 6],
  },
  {
    title: "Taxa de economia",
    value: 3.06,
    description: "0.6% vs últimos 30 dias",
    change: 0.6,
    icon: <ScaleIcon className="size-3.5" />,
    format: (value) => `${value.toFixed(2)}%`,
    bars: [6, 7, 9, 8, 10, 11, 9],
  },
];

const dailyFlowBars = [
  14, 19, 17, 25, 21, 29, 31, 18, 24, 28, 34, 30, 26, 33, 32, 22, 18, 41, 35,
  27, 26, 37, 30, 38, 22, 44, 41, 35, 31, 37, 34, 22, 33,
] as const;

const monthlyCampaignBars = [
  18, 42, 27, 33, 21, 38, 25, 44, 31, 27, 39, 34,
] as const;

const rangeOptions = ["14D", "1M", "3M", "6M"] as const;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
    notation: value >= 1000 ? "compact" : "standard",
  }).format(value);
}

function formatInteger(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 0,
  }).format(value);
}

function TrendLabel({
  change,
  description,
}: {
  change: number;
  description: string;
}) {
  const positive = change >= 0;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 text-sm",
        positive ? "text-emerald-400" : "text-rose-400",
      )}
    >
      {positive ? (
        <TrendingUpIcon className="size-3.5" />
      ) : (
        <TrendingDownIcon className="size-3.5" />
      )}
      <span className="font-medium">{description}</span>
    </div>
  );
}

function MiniBars({ bars }: { bars: readonly number[] }) {
  const max = Math.max(...bars, 1);

  return (
    <div className="flex h-10 items-end gap-1">
      {bars.map((bar, index) => (
        <div
          key={`mini-bar-${index}`}
          className="w-1.5 rounded-[1px] bg-white/28"
          style={{ height: `${(bar / max) * 100}%` }}
        />
      ))}
    </div>
  );
}

function SummaryCard({
  title,
  value,
  description,
  change,
  icon,
  format,
  bars,
}: SummaryCard) {
  return (
    <Card className="financial-panel-border !pt-0 !pb-0 gap-0 p-0 ring-0">
      <CardHeader className="px-4 py-3">
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="opacity-80">{icon}</span>
            <span>{title}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-4 px-4 py-4">
        <div className="space-y-2">
          <div className="text-[2rem] leading-none font-semibold tracking-tight text-foreground">
            <AnimatedNumber value={value} format={format} />
          </div>
          <TrendLabel change={change} description={description} />
        </div>
        <MiniBars bars={bars} />
      </CardContent>
    </Card>
  );
}

function SegmentedRanges() {
  return (
    <div className="inline-flex rounded-[0.9rem] border border-white/10 p-1">
      {rangeOptions.map((option, index) => (
        <button
          key={option}
          className={cn(
            "rounded-[0.7rem] px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors",
            index === 0 && "bg-white/8 text-foreground",
          )}
          type="button"
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function LargeBarChart() {
  const max = Math.max(...dailyFlowBars, 1);

  return (
    <div className="mt-5">
      <div className="grid h-[16rem] grid-cols-[repeat(33,minmax(0,1fr))] items-end gap-1 border-t border-white/8 pt-4">
        {dailyFlowBars.map((bar, index) => (
          <div
            key={`daily-bar-${index}`}
            className="flex h-full items-end justify-center"
          >
            <div
              className="flex w-full max-w-5 flex-col justify-end gap-0.5"
              style={{ height: `${(bar / max) * 100}%` }}
            >
              {Array.from({ length: bar }).map((_, segmentIndex) => (
                <div
                  key={`daily-bar-${index}-segment-${segmentIndex}`}
                  className={cn(
                    "h-1.5 rounded-[1px]",
                    segmentIndex > bar * 0.58 ? "bg-white/80" : "bg-white/24",
                  )}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-7 text-sm text-muted-foreground">
        {[
          "22 Mar",
          "26 Mar",
          "30 Mar",
          "03 Abr",
          "07 Abr",
          "11 Abr",
          "19 Abr",
        ].map((label, index, labels) => (
          <span
            key={label}
            className={cn(
              index === 0 && "text-left",
              index === labels.length - 1 && "text-right",
              index > 0 && index < labels.length - 1 && "text-center",
            )}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function MonthlyBarChart() {
  const max = Math.max(...monthlyCampaignBars, 1);

  return (
    <div className="mt-8">
      <div className="grid h-[16rem] grid-cols-12 items-end gap-3 border-t border-white/8 pt-4">
        {monthlyCampaignBars.map((bar, index) => (
          <div
            key={`month-bar-${index}`}
            className="flex h-full items-end justify-center"
          >
            <div
              className="flex w-full max-w-4 flex-col justify-end gap-0.5"
              style={{ height: `${(bar / max) * 100}%` }}
            >
              {Array.from({ length: bar }).map((_, segmentIndex) => (
                <div
                  key={`month-bar-${index}-segment-${segmentIndex}`}
                  className={cn(
                    "h-1.5 rounded-[1px]",
                    index === 7 ? "bg-white/82" : "bg-white/24",
                  )}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-6 text-sm text-muted-foreground">
        {["Jan", "Mar", "Mai", "Jul", "Set", "Nov"].map(
          (label, index, labels) => (
            <span
              key={label}
              className={cn(
                index === 0 && "text-left",
                index === labels.length - 1 && "text-right",
                index > 0 && index < labels.length - 1 && "text-center",
              )}
            >
              {label}
            </span>
          ),
        )}
      </div>
    </div>
  );
}

function MainFlowCard() {
  return (
    <Card className="financial-panel-border gap-0 p-0 ring-0">
      <CardContent className="px-5 py-5">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <div className="text-[2.25rem] leading-none font-semibold tracking-tight">
                <AnimatedNumber
                  value={413_000}
                  format={formatCompactCurrency}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Total movimentado nos últimos 30 dias
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 lg:items-end">
              <SegmentedRanges />
              <TrendLabel change={1.5} description="1.5% vs últimos 30 dias" />
            </div>
          </div>

          <div className="flex items-center gap-5 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-white/36" />
              <span>Essenciais</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-white/80" />
              <span>Não essenciais</span>
            </div>
          </div>

          <LargeBarChart />
        </div>
      </CardContent>
    </Card>
  );
}

function SecondaryFlowCard() {
  return (
    <Card className="financial-panel-border gap-0 p-0 ring-0">
      <CardContent className="px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[2.25rem] leading-none font-semibold tracking-tight">
              <AnimatedNumber value={92_500} format={formatCompactCurrency} />
            </div>
            <p className="text-sm text-muted-foreground">
              Reservado para metas em agosto
            </p>
          </div>
          <TrendLabel change={5.2} description="5.2%" />
        </div>

        <MonthlyBarChart />
      </CardContent>
    </Card>
  );
}

export function TopOverviewSection() {
  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-4xl font-semibold tracking-tight text-foreground">
          Bem-vindo de volta, Victor.
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <SummaryCard key={card.title} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <MainFlowCard />
        <SecondaryFlowCard />
      </div>
    </section>
  );
}
