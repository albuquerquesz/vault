import {
  CreditCardIcon,
  ReceiptTextIcon,
  ScaleIcon,
  WalletIcon,
} from "lucide-react";
import { MonthlyBillsCard } from "@/components/monthly-bills-card";
import { OrderSourceMixChart } from "@/components/order-source-mix-chart";
import { SalesByHourHeatmap } from "@/components/sales-by-hour-heatmap";
import {
  type TopOverviewMainFlowRange,
  type TopOverviewSecondaryFlow,
  type TopOverviewSummaryCard,
  TopOverviewSection,
} from "@/components/top-overview-section";
import { TrafficSourcesCard } from "@/components/traffic-sources-card";

const mainFlowYTicks = [
  { value: 0, label: "0k" },
  { value: 5, label: "5k" },
  { value: 10, label: "10k" },
  { value: 15, label: "15k" },
  { value: 20, label: "20k" },
] as const;

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
    xLabels: [
      { label: "05 Abr", index: 0 },
      { label: "07 Abr", index: 2 },
      { label: "09 Abr", index: 4 },
      { label: "11 Abr", index: 6 },
      { label: "13 Abr", index: 8 },
      { label: "15 Abr", index: 10 },
      { label: "19 Abr", index: 13 },
    ],
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
    xLabels: [
      { label: "22 Mar", index: 0 },
      { label: "26 Mar", index: 5 },
      { label: "30 Mar", index: 9 },
      { label: "03 Abr", index: 12 },
      { label: "07 Abr", index: 16 },
      { label: "11 Abr", index: 20 },
      { label: "15 Abr", index: 24 },
      { label: "19 Abr", index: 29 },
    ],
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
    xLabels: [
      { label: "Jan", index: 0 },
      { label: "Fev", index: 4 },
      { label: "Mar", index: 8 },
      { label: "Abr", index: 12 },
      { label: "Mai", index: 16 },
      { label: "Jun", index: 20 },
      { label: "Jul", index: 23 },
    ],
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
    xLabels: [
      { label: "Nov", index: 0 },
      { label: "Dez", index: 2 },
      { label: "Jan", index: 4 },
      { label: "Fev", index: 6 },
      { label: "Mar", index: 8 },
      { label: "Abr", index: 10 },
      { label: "Mai", index: 11 },
    ],
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
        secondaryFlow={topSecondaryFlow}
        initialRange="1M"
      />
      <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-[minmax(0,3fr)_minmax(0,7fr)]">
        <div className="h-full">
          <MonthlyBillsCard />
        </div>
        <div className="h-full">
          <OrderSourceMixChart totalNetWorth={1842} />
        </div>
      </div>
      <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2">
        <div className="h-full">
          <TrafficSourcesCard />
        </div>
        <div className="h-full">
          <SalesByHourHeatmap />
        </div>
      </div>
    </div>
  );
}
