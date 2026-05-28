import {
  Bell,
  ChevronRight,
  CircleAlert,
  FileDown,
  Grid3X3,
  LifeBuoy,
  Search,
  Settings,
  ShoppingCart,
  UserRound,
  Users,
} from "lucide-react";

const sources = [
  { label: "Organic search", value: "4.1K", progress: 100 },
  { label: "Direct", value: "2.9K", progress: 71 },
  { label: "Referral", value: "1.6K", progress: 39 },
  { label: "Paid social", value: "980", progress: 24 },
  { label: "Email", value: "620", progress: 15 },
];

const channelMix = [
  { label: "Organic search", percent: 37.9, value: 698, color: "bg-zinc-100" },
  { label: "Direct", percent: 28, value: 516, color: "bg-zinc-400" },
  { label: "Referral", percent: 15, value: 276, color: "bg-zinc-500" },
  { label: "Paid social", percent: 12, value: 221, color: "bg-zinc-600" },
  { label: "Others", percent: 7.1, value: 131, color: "bg-zinc-700" },
];

const heatRows = [
  { day: "Mon", values: [0.05, 0.1, 0.15, 0.2, 0.28, 0.34, 0.4, 0.48, 0.5, 0.6, 0.7, 0.8] },
  { day: "Tue", values: [0.04, 0.1, 0.12, 0.18, 0.22, 0.3, 0.35, 0.42, 0.48, 0.58, 0.66, 0.75] },
  { day: "Wed", values: [0.03, 0.08, 0.1, 0.14, 0.2, 0.28, 0.36, 0.4, 0.46, 0.56, 0.68, 0.78] },
  { day: "Thu", values: [0.03, 0.06, 0.1, 0.15, 0.2, 0.25, 0.34, 0.42, 0.52, 0.64, 0.72, 0.86] },
  { day: "Fri", values: [0.04, 0.08, 0.12, 0.18, 0.25, 0.3, 0.38, 0.47, 0.58, 0.68, 0.78, 0.94] },
  { day: "Sat", values: [0.06, 0.1, 0.16, 0.24, 0.34, 0.45, 0.5, 0.58, 0.64, 0.72, 0.86, 1] },
  { day: "Sun", values: [0.05, 0.09, 0.14, 0.2, 0.3, 0.38, 0.46, 0.53, 0.6, 0.7, 0.82, 0.95] },
];

const quickActions = [
  { title: "Add Campaign", description: "Create a Campaign.", icon: Grid3X3 },
  { title: "Review unfulfilled", description: "Orders waiting to ship.", icon: ShoppingCart },
  { title: "Workspace settings", description: "Team, roles, permissions.", icon: Settings },
  { title: "Export sales", description: "CSV for accounting.", icon: FileDown },
];

const sidebarIcons = [Grid3X3, Users, ShoppingCart, CircleAlert, LifeBuoy, Settings];

function Panel({
  title,
  right,
  children,
  className = "",
}: {
  title: string;
  right?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-sm border border-zinc-800 bg-[#0000] ${className}`}>
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 text-[11px] text-zinc-400">
        <p className="tracking-wide">{title}</p>
        {right ? <p>{right}</p> : null}
      </div>
      {children}
    </section>
  );
}

function FunnelPanel() {
  return (
    <Panel className="md:col-span-7" title="7.8%" right="+0.4%">
      <div className="px-4 pt-3 text-xs text-zinc-400">
        <p>Overall purchase rate · 5.6K orders from 72K views · Last 30 days</p>
      </div>
      <div className="grid grid-cols-4 divide-x divide-zinc-800 px-2 pb-3 pt-4">
        {["72K", "38.2K", "16.8K", "5.6K"].map((value, index) => (
          <div className="space-y-2 px-3" key={value}>
            <p className="text-center text-xs text-zinc-200">{value}</p>
            <div className="h-22 rounded-sm border border-zinc-800 bg-[#0000] p-2">
              <div
                className="mx-auto mt-7 h-8 rounded-full bg-gradient-to-r from-zinc-300 to-zinc-600"
                style={{
                  width: `${100 - index * 24}%`,
                }}
              />
              <p className="mt-3 text-center text-[10px] text-zinc-300">
                {index === 0 ? "100%" : index === 1 ? "53%" : index === 2 ? "23%" : "8%"}
              </p>
            </div>
            <p className="text-center text-[10px] text-zinc-500">
              {index === 0 ? "Product views" : index === 1 ? "Add to cart" : index === 2 ? "Checkout" : "Purchase"}
            </p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function PiePanel() {
  return (
    <Panel className="md:col-span-5" title="1,842" right="+0.5%">
      <div className="px-4 pt-3 text-xs text-zinc-400">
        <p>Total orders in last 30 days</p>
      </div>
      <div className="grid items-center gap-4 p-4 md:grid-cols-[190px_1fr]">
        <div className="flex items-center justify-center">
          <svg className="h-40 w-40 -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" fill="none" r="44" stroke="#27272a" strokeWidth="24" />
            {[
              { value: 37.9, color: "#f4f4f5" },
              { value: 28, color: "#a1a1aa" },
              { value: 15, color: "#71717a" },
              { value: 12, color: "#52525b" },
              { value: 7.1, color: "#3f3f46" },
            ].reduce(
              (acc, item) => {
                const circumference = 2 * Math.PI * 44;
                const length = (item.value / 100) * circumference;
                const segment = (
                  <circle
                    cx="60"
                    cy="60"
                    fill="none"
                    key={item.value}
                    r="44"
                    stroke={item.color}
                    strokeDasharray={`${length} ${circumference}`}
                    strokeDashoffset={acc.offset}
                    strokeWidth="24"
                  />
                );
                acc.offset -= length;
                acc.nodes.push(segment);
                return acc;
              },
              { offset: 0, nodes: [] as React.ReactNode[] },
            ).nodes}
          </svg>
        </div>
        <div className="space-y-2 text-xs">
          {channelMix.map((row) => (
            <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 text-zinc-300" key={row.label}>
              <span className={`h-2.5 w-2.5 rounded-full ${row.color}`} />
              <p className="truncate">{row.label}</p>
              <p className="w-11 text-right text-zinc-500">{row.percent}%</p>
              <p className="w-9 text-right">{row.value}</p>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function TrafficPanel() {
  return (
    <Panel className="md:col-span-4" title="Traffic sources" right="12 months">
      <div className="space-y-4 p-4">
        {sources.map((source) => (
          <div key={source.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <p className="text-zinc-200">{source.label}</p>
              <p className="text-zinc-400">{source.value}</p>
            </div>
            <div className="h-1.5 rounded-full bg-[#0000]">
              <div className="h-full rounded-full bg-zinc-200" style={{ width: `${source.progress}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function TeamPanel() {
  return (
    <Panel className="md:col-span-4" title="Team">
      <div className="flex flex-col items-center gap-3 px-4 py-6 text-xs">
        <div className="flex -space-x-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-[#0000]">
            <UserRound className="h-4 w-4 text-zinc-300" />
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-[#0000]">
            <Users className="h-4 w-4 text-zinc-200" />
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-[#0000]">
            <UserRound className="h-4 w-4 text-zinc-300" />
          </div>
        </div>
        <p className="text-zinc-200">No Team Members</p>
        <p className="text-zinc-500">Invite your team to collaborate on this project.</p>
        <button className="rounded-sm border border-zinc-700 bg-[#0000] px-3 py-1.5 text-zinc-200 transition hover:border-zinc-500 hover:bg-[#0000]" type="button">
          + Invite Members
        </button>
      </div>
    </Panel>
  );
}

function HeatmapPanel() {
  return (
    <Panel className="md:col-span-4" title="Sales by hour" right="Last 7 days">
      <div className="space-y-3 p-4">
        <div className="flex items-end justify-between">
          <p className="text-3xl font-semibold text-zinc-100">$4.8K</p>
          <p className="text-xs text-zinc-300">$1.5K Avg / hour</p>
        </div>
        <p className="text-[11px] text-zinc-500">Peak · Sat 9p-10p</p>
        <div className="space-y-1.5">
          {heatRows.map((row) => (
            <div className="grid grid-cols-[22px_1fr] items-center gap-2" key={row.day}>
              <p className="text-[10px] text-zinc-500">{row.day}</p>
              <div className="grid grid-cols-12 gap-1">
                {row.values.map((value, index) => (
                  <div
                    className="h-3 rounded-[2px] bg-zinc-300"
                    key={`${row.day}-${index}`}
                    style={{ opacity: value }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function ActionsPanel() {
  return (
    <Panel className="md:col-span-4" title="Quick actions">
      <div className="divide-y divide-zinc-800">
        {quickActions.map((action) => (
          <button
            className="flex w-full items-start gap-3 bg-[#0000] px-4 py-3 text-left transition hover:bg-[#0000]"
            key={action.title}
            type="button"
          >
            <action.icon className="mt-0.5 h-4 w-4 text-zinc-500" />
            <div className="flex-1">
              <p className="text-xs text-zinc-200">{action.title}</p>
              <p className="mt-1 text-[11px] text-zinc-500">{action.description}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-zinc-600" />
          </button>
        ))}
      </div>
    </Panel>
  );
}

export function FinancialDashboard() {
  return (
    <main
      className="h-full w-full bg-[#0000] text-zinc-100"
      style={{ fontFamily: '"Space Grotesk", sans-serif' }}
    >
      <div className="flex h-full w-full">
        <aside className="hidden w-16 shrink-0 border-r border-zinc-900 bg-[#0000] px-2 py-4 md:block">
          <div className="space-y-2">
            {sidebarIcons.map((Icon, index) => (
              <button
                className={`flex h-10 w-full items-center justify-center rounded-sm border transition ${
                  index === 0
                    ? "border-zinc-700 bg-[#0000] text-zinc-100"
                    : "border-transparent text-zinc-500 hover:border-zinc-800 hover:bg-[#0000] hover:text-zinc-300"
                }`}
                key={index}
                type="button"
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </aside>
        <section className="min-w-0 flex-1 border-x border-zinc-900 bg-[#0000]">
          <header className="flex items-center justify-between border-b border-zinc-900 px-4 py-3">
            <p className="text-lg text-zinc-100">Overview</p>
            <div className="flex items-center gap-2">
              <button className="rounded-sm border border-zinc-800 bg-[#0000] p-2 text-zinc-400 hover:text-zinc-100" type="button">
                <Search className="h-4 w-4" />
              </button>
              <button className="rounded-sm border border-zinc-800 bg-[#0000] p-2 text-zinc-400 hover:text-zinc-100" type="button">
                <Bell className="h-4 w-4" />
              </button>
            </div>
          </header>
          <div className="grid gap-3 p-3 md:grid-cols-12">
            <FunnelPanel />
            <PiePanel />
            <TrafficPanel />
            <TeamPanel />
            <HeatmapPanel />
            <ActionsPanel />
          </div>
        </section>
      </div>
    </main>
  );
}

export default FinancialDashboard;
