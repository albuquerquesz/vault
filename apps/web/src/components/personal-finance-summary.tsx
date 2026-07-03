"use client";

import { Card, CardContent, CardHeader } from "@vault/ui/components/card";
import { cn } from "@vault/ui/lib/utils";
import {
  ArrowDownCircleIcon,
  ArrowUpCircleIcon,
  CreditCardIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletIcon,
} from "lucide-react";
import { AnimatedNumber } from "@/components/animated-number";
import {
  MaskedMonetaryValue,
  useMonetaryVisibility,
} from "@/components/monetary-visibility";

type SummaryCard = {
  title: string;
  value: number;
  description: string;
  change: number;
  icon: React.ReactNode;
  format: (value: number) => string;
  bars: readonly number[];
  isMonetary?: boolean;
};

type DistributionItem = {
  label: string;
  value: number;
  color: string;
};

const summaryCards: SummaryCard[] = [
  {
    title: "Entradas",
    value: 8_500,
    description: "5.2% vs mês anterior",
    change: 5.2,
    icon: <ArrowUpCircleIcon className="size-3.5" />,
    format: (value) =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 0,
      }).format(value),
    bars: [6, 8, 7, 9, 8, 10, 9],
    isMonetary: true,
  },
  {
    title: "Saídas",
    value: 5_820,
    description: "3.1% vs mês anterior",
    change: 3.1,
    icon: <ArrowDownCircleIcon className="size-3.5" />,
    format: (value) =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 0,
      }).format(value),
    bars: [7, 6, 8, 5, 7, 6, 8],
    isMonetary: true,
  },
  {
    title: "Percentual gasto",
    value: 68.4,
    description: "2.1% vs mês anterior",
    change: -2.1,
    icon: <CreditCardIcon className="size-3.5" />,
    format: (value) => `${value.toFixed(1)}%`,
    bars: [8, 7, 9, 6, 8, 7, 6],
  },
  {
    title: "Distribuição dos gastos",
    value: 5,
    description: "5 categorias ativas",
    change: 0,
    icon: <WalletIcon className="size-3.5" />,
    format: (value) => `${value} categorias`,
    bars: [5, 5, 5, 5, 5, 5, 5],
  },
];

const distributionItems: DistributionItem[] = [
  { label: "Alimentação", value: 25, color: "bg-white/88" },
  { label: "Moradia", value: 30, color: "bg-white/60" },
  { label: "Transporte", value: 15, color: "bg-white/40" },
  { label: "Lazer", value: 20, color: "bg-white/24" },
  { label: "Outros", value: 10, color: "bg-white/12" },
];

type OverviewColumnStatus = "primary" | "secondary";
type OverviewSegmentedColumnSegment = {
  status: OverviewColumnStatus;
};

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
        "inline-flex items-center gap-1.5 whitespace-nowrap text-sm",
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

function OverviewColumnSegment({
  status,
  className,
}: {
  status: OverviewColumnStatus;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "shrink-0 rounded-[2px]",
        status === "primary" ? "bg-white/88" : "bg-white/24",
        className,
      )}
    />
  );
}

function OverviewSegmentedColumn({
  segments,
  height,
  gapClassName = "gap-[3px]",
  widthClassName = "w-full",
  segmentClassName,
  className,
}: {
  segments: readonly OverviewSegmentedColumnSegment[];
  height: string;
  gapClassName?: string;
  widthClassName?: string;
  segmentClassName?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "shrink-0 flex flex-col justify-end",
        widthClassName,
        gapClassName,
        className,
      )}
      style={{ height }}
    >
      {segments.map((segment, index) => (
        <OverviewColumnSegment
          key={`${segment.status}-${index}`}
          status={segment.status}
          className={segmentClassName}
        />
      ))}
    </div>
  );
}

function MiniBars({ bars }: { bars: readonly number[] }) {
  const targetColumnCount = Math.min(5, bars.length);
  const groupedBars = Array.from(
    { length: targetColumnCount },
    (_, groupIndex) => {
      const start = Math.floor((groupIndex * bars.length) / targetColumnCount);
      const end = Math.floor(((groupIndex + 1) * bars.length) / targetColumnCount);
      const slice = bars.slice(start, Math.max(start + 1, end));
      return Math.max(...slice, 1);
    },
  );
  const max = Math.max(...groupedBars, 1);
  const highlightedColumnIndex = groupedBars.indexOf(max);

  return (
    <div className="flex h-[5.5rem] shrink-0 items-end gap-[4px]">
      {groupedBars.map((bar, index) => (
        <OverviewSegmentedColumn
          key={`mini-bar-${index}`}
          segments={Array.from({ length: bar }, () => ({
            status:
              index === highlightedColumnIndex
                ? ("primary" as const)
                : ("secondary" as const),
          }))}
          height={`${(bar / max) * 100}%`}
          widthClassName="w-[10px]"
          gapClassName="gap-[2px]"
          segmentClassName="h-[8px] rounded-none"
        />
      ))}
    </div>
  );
}

function SummaryCardComponent({
  title,
  value,
  description,
  change,
  icon,
  format,
  bars,
  isMonetary = false,
}: SummaryCard) {
  return (
    <Card className="financial-panel-border !pt-0 !pb-0 gap-0 p-0 ring-0">
      <CardHeader className="px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="opacity-80">{icon}</span>
          <span>{title}</span>
        </div>
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-4 px-4 py-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="text-[2rem] leading-none whitespace-nowrap font-semibold tracking-tight text-foreground">
            {isMonetary ? (
              <MaskedMonetaryValue animated format={format} value={value} />
            ) : (
              <AnimatedNumber value={value} format={format} />
            )}
          </div>
          <TrendLabel change={change} description={description} />
        </div>
        <MiniBars bars={bars} />
      </CardContent>
    </Card>
  );
}

function DistributionList() {
  return (
    <div className="space-y-3">
      {distributionItems.map((item) => (
        <div key={item.label} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className={cn("size-2.5 rounded-full", item.color)} />
            <span className="text-sm text-muted-foreground">{item.label}</span>
          </div>
          <span className="text-sm font-medium tabular-nums">
            {item.value}%
          </span>
        </div>
      ))}
    </div>
  );
}

export function PersonalFinanceSummary() {
  return (
    <div className="grid grid-cols-1 gap-px bg-border p-px md:grid-cols-2 lg:grid-cols-4">
      {summaryCards.map((card) => (
        <SummaryCardComponent key={card.title} {...card} />
      ))}
    </div>
  );
}

export function ExpenseDistribution() {
  return (
    <Card className="financial-panel-border ring-0">
      <CardHeader className="px-4 py-3">
        <div className="text-sm text-muted-foreground">
          Distribuição dos gastos
        </div>
      </CardHeader>
      <CardContent className="px-4 py-4">
        <DistributionList />
      </CardContent>
    </Card>
  );
}
