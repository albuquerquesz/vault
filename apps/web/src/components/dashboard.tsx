import {
  CreditCardIcon,
  ReceiptTextIcon,
  ScaleIcon,
  WalletIcon,
} from "lucide-react";
import { InvestmentsCard } from "@/components/investments-card";
import { MonthlyBillsCard } from "@/components/monthly-bills-card";
import { OrderSourceMixChart } from "@/components/order-source-mix-chart";
import { SalesByHourHeatmap } from "@/components/sales-by-hour-heatmap";
import {
  type TopOverviewMainFlowRange,
  type TopOverviewSecondaryFlow,
  type TopOverviewSummaryCard,
  TopOverviewSection,
} from "@/components/top-overview-section";
import { dashboardDetailDefinitions } from "@/components/dashboard-detail-definitions";
import { TrafficSourcesCard } from "@/components/traffic-sources-card";

const mainFlowYTicks = [
  { value: 0, label: "0k" },
  { value: 5, label: "5k" },
  { value: 10, label: "10k" },
  { value: 15, label: "15k" },
  { value: 20, label: "20k" },
] as const;

function buildSequentialDateLabels(count: number, startDate: string, stepDays = 1) {
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
  const start = new Date(`${startDate}T00:00:00Z`);

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index * stepDays);

    return {
      index,
      label: formatter
        .format(date)
        .replace(".", "")
        .replace(" de ", " ")
        .replace(/^(\d{2})\s(.+)$/, "$1 $2"),
    };
  });
}

function buildIndexedDateLabels(
  startDate: string,
  indexes: readonly number[],
  stepDays = 1,
) {
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
  const start = new Date(`${startDate}T00:00:00Z`);

  return indexes.map((index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index * stepDays);

    return {
      index,
      label: formatter
        .format(date)
        .replace(".", "")
        .replace(" de ", " ")
        .replace(/^(\d{2})\s(.+)$/, "$1 $2"),
    };
  });
}

function buildBiMonthlyLabels() {
  const labels = [
    "01 Nov",
    "15 Nov",
    "01 Dez",
    "15 Dez",
    "01 Jan",
    "15 Jan",
    "01 Fev",
    "15 Fev",
    "01 Mar",
    "15 Mar",
    "01 Abr",
    "15 Abr",
  ];

  return labels.map((label, index) => ({ label, index }));
}

function formatCompactCurrency(value: number) {
  const absoluteValue = Math.abs(value);

  if (absoluteValue >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }

  if (absoluteValue >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(0)}K`;
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

const topSummaryCards: TopOverviewSummaryCard[] = [
  {
    title: "Saídas do mês",
    value: 284_920,
    description: "8.2% vs últimos 30 dias",
    change: 8.2,
    icon: <WalletIcon className="size-3.5" />,
    format: formatCompactCurrency,
    bars: [5, 8, 11, 14, 10, 12, 9],
    isMonetary: true,
  },
  {
    title: "Lançamentos",
    value: 1_842,
    description: "4.1% vs últimos 30 dias",
    change: 4.1,
    icon: <ReceiptTextIcon className="size-3.5" />,
    format: (value) => new Intl.NumberFormat("pt-BR").format(value),
    bars: [7, 10, 13, 11, 12, 14, 10],
  },
  {
    title: "Ticket médio",
    value: 154.6,
    description: "1.3% vs últimos 30 dias",
    change: -1.3,
    icon: <CreditCardIcon className="size-3.5" />,
    format: (value) =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value),
    bars: [11, 12, 10, 9, 13, 8, 6],
    isMonetary: true,
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

const topMainFlowData: Record<
  "14D" | "1M" | "3M" | "6M",
  TopOverviewMainFlowRange
> = {
  "14D": {
    total: 198_400,
    description: "Total movimentado nos últimos 14 dias",
    change: 0.9,
    legend: ["Essenciais", "Não essenciais"],
    bars: [
      { essenciais: 4, naoEssenciais: 5 },
      { essenciais: 5, naoEssenciais: 7 },
      { essenciais: 5, naoEssenciais: 6 },
      { essenciais: 6, naoEssenciais: 8 },
      { essenciais: 7, naoEssenciais: 9 },
      { essenciais: 6, naoEssenciais: 7 },
      { essenciais: 6, naoEssenciais: 8 },
      { essenciais: 7, naoEssenciais: 9 },
      { essenciais: 8, naoEssenciais: 10 },
      { essenciais: 7, naoEssenciais: 9 },
      { essenciais: 9, naoEssenciais: 11 },
      { essenciais: 8, naoEssenciais: 10 },
      { essenciais: 7, naoEssenciais: 9 },
      { essenciais: 8, naoEssenciais: 10 },
    ],
    xLabels: buildIndexedDateLabels("2026-04-05", [0, 2, 4, 6, 8, 10, 13]),
    yTicks: mainFlowYTicks,
  },
  "1M": {
    total: 413_000,
    description: "Total movimentado nos últimos 30 dias",
    change: 1.5,
    legend: ["Essenciais", "Não essenciais"],
    bars: [
      { essenciais: 5, naoEssenciais: 4 },
      { essenciais: 6, naoEssenciais: 4 },
      { essenciais: 6, naoEssenciais: 5 },
      { essenciais: 5, naoEssenciais: 4 },
      { essenciais: 6, naoEssenciais: 5 },
      { essenciais: 7, naoEssenciais: 6 },
      { essenciais: 5, naoEssenciais: 4 },
      { essenciais: 4, naoEssenciais: 5 },
      { essenciais: 6, naoEssenciais: 6 },
      { essenciais: 5, naoEssenciais: 6 },
      { essenciais: 4, naoEssenciais: 5 },
      { essenciais: 6, naoEssenciais: 7 },
      { essenciais: 7, naoEssenciais: 7 },
      { essenciais: 5, naoEssenciais: 5 },
      { essenciais: 4, naoEssenciais: 4 },
      { essenciais: 8, naoEssenciais: 7 },
      { essenciais: 7, naoEssenciais: 6 },
      { essenciais: 6, naoEssenciais: 5 },
      { essenciais: 6, naoEssenciais: 5 },
      { essenciais: 7, naoEssenciais: 6 },
      { essenciais: 6, naoEssenciais: 5 },
      { essenciais: 4, naoEssenciais: 4 },
      { essenciais: 8, naoEssenciais: 7 },
      { essenciais: 8, naoEssenciais: 8 },
      { essenciais: 7, naoEssenciais: 7 },
      { essenciais: 6, naoEssenciais: 6 },
      { essenciais: 7, naoEssenciais: 8 },
      { essenciais: 6, naoEssenciais: 7 },
      { essenciais: 5, naoEssenciais: 5 },
      { essenciais: 6, naoEssenciais: 6 },
    ],
    xLabels: buildIndexedDateLabels("2026-03-22", [0, 4, 8, 12, 16, 20, 24, 29]),
    yTicks: mainFlowYTicks,
  },
  "3M": {
    total: 1_186_000,
    description: "Total movimentado nos últimos 3 meses",
    change: 3.8,
    legend: ["Essenciais", "Não essenciais"],
    bars: [
      { essenciais: 4, naoEssenciais: 5 },
      { essenciais: 5, naoEssenciais: 6 },
      { essenciais: 5, naoEssenciais: 7 },
      { essenciais: 6, naoEssenciais: 8 },
      { essenciais: 6, naoEssenciais: 8 },
      { essenciais: 7, naoEssenciais: 9 },
      { essenciais: 8, naoEssenciais: 10 },
      { essenciais: 7, naoEssenciais: 10 },
      { essenciais: 8, naoEssenciais: 11 },
      { essenciais: 7, naoEssenciais: 10 },
      { essenciais: 9, naoEssenciais: 11 },
      { essenciais: 10, naoEssenciais: 12 },
      { essenciais: 9, naoEssenciais: 11 },
      { essenciais: 8, naoEssenciais: 10 },
      { essenciais: 9, naoEssenciais: 12 },
      { essenciais: 10, naoEssenciais: 13 },
      { essenciais: 10, naoEssenciais: 12 },
      { essenciais: 11, naoEssenciais: 13 },
      { essenciais: 12, naoEssenciais: 14 },
      { essenciais: 11, naoEssenciais: 13 },
      { essenciais: 11, naoEssenciais: 14 },
      { essenciais: 12, naoEssenciais: 15 },
      { essenciais: 11, naoEssenciais: 14 },
      { essenciais: 10, naoEssenciais: 13 },
    ],
    xLabels: buildSequentialDateLabels(24, "2026-01-01", 4),
    yTicks: mainFlowYTicks,
  },
  "6M": {
    total: 2_447_000,
    description: "Total movimentado nos últimos 6 meses",
    change: 5.6,
    legend: ["Essenciais", "Não essenciais"],
    bars: [
      { essenciais: 3, naoEssenciais: 5 },
      { essenciais: 4, naoEssenciais: 6 },
      { essenciais: 5, naoEssenciais: 7 },
      { essenciais: 6, naoEssenciais: 8 },
      { essenciais: 5, naoEssenciais: 8 },
      { essenciais: 7, naoEssenciais: 9 },
      { essenciais: 8, naoEssenciais: 10 },
      { essenciais: 9, naoEssenciais: 11 },
      { essenciais: 8, naoEssenciais: 11 },
      { essenciais: 9, naoEssenciais: 12 },
      { essenciais: 10, naoEssenciais: 13 },
      { essenciais: 11, naoEssenciais: 14 },
    ],
    xLabels: buildBiMonthlyLabels(),
    yTicks: mainFlowYTicks,
  },
};

const topSecondaryFlow: TopOverviewSecondaryFlow = {
  total: 92_500,
  description: "Reservado para metas em agosto",
  change: 5.2,
  bars: [14, 28, 19, 23, 16, 27, 18, 31, 22, 19, 26, 24],
  xLabels: [
    { label: "Jan", index: 0 },
    { label: "Mar", index: 2 },
    { label: "Mai", index: 4 },
    { label: "Jul", index: 6 },
    { label: "Set", index: 8 },
    { label: "Nov", index: 10 },
  ],
  highlightedIndex: 7,
  highlightedValueLabel: "R$ 93K",
};

export function Dashboard() {
  return (
    <div className="grid grid-cols-1 gap-6">
      <TopOverviewSection
        title="Bem-vindo de volta, Victor! 👋"
        summaryCards={topSummaryCards}
        mainFlowData={topMainFlowData}
        rightContent={
          <MonthlyBillsCard
            className="min-h-0"
            detailHref={dashboardDetailDefinitions.monthlyBills.path}
          />
        }
        extraRightContent={
          <OrderSourceMixChart
            detailHref={dashboardDetailDefinitions.expenseDistribution.path}
            totalNetWorth={1842}
          />
        }
        initialRange="1M"
        showMainFlow={false}
      />
      <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 xl:grid-cols-3">
        <div className="h-full">
          <TrafficSourcesCard
            detailHref={dashboardDetailDefinitions.trafficSources.path}
          />
        </div>
        <div className="h-full">
          <SalesByHourHeatmap
            detailHref={dashboardDetailDefinitions.dailyExpenses.path}
          />
        </div>
        <div className="h-full">
          <InvestmentsCard
            detailHref={dashboardDetailDefinitions.investments.path}
          />
        </div>
      </div>
    </div>
  );
}
