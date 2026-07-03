export type DashboardDetailKey =
	| "expenseDistribution"
	| "trafficSources"
	| "dailyExpenses";

export type DashboardDetailDefinition = {
	key: DashboardDetailKey;
	path: string;
	title: string;
	description: string;
	scaffoldTitle: string;
	scaffoldDescription: string;
};

export const dashboardDetailDefinitions = {
	expenseDistribution: {
		key: "expenseDistribution",
		path: "/dashboard/expense-distribution",
		title: "Distribuição dos gastos",
		description:
			"Explore a participação de cada origem nas despesas consolidadas do período.",
		scaffoldTitle: "Mapa de distribuição de gastos",
		scaffoldDescription:
			"Esta aba vai aprofundar a distribuição dos gastos com participação por origem e comparativos mensais.",
	},
	trafficSources: {
		key: "trafficSources",
		path: "/dashboard/traffic-sources",
		title: "Canais de origem",
		description:
			"Visualize os principais canais de origem e a relevância de cada fonte no período.",
		scaffoldTitle: "Leitura dos canais de origem",
		scaffoldDescription:
			"Esta aba vai expandir os canais de origem com evolução histórica, ranking e cortes por canal.",
	},
	dailyExpenses: {
		key: "dailyExpenses",
		path: "/dashboard/daily-expenses",
		title: "Despesas diárias",
		description:
			"Veja quando os gastos se concentram ao longo dos dias e das faixas horárias.",
		scaffoldTitle: "Mapa diário de despesas",
		scaffoldDescription:
			"Esta aba vai reunir a distribuição diária dos gastos com destaque para picos, médias e horários críticos.",
	},
} satisfies Record<DashboardDetailKey, DashboardDetailDefinition>;

export const dashboardDetailList = [
	dashboardDetailDefinitions.expenseDistribution,
	dashboardDetailDefinitions.trafficSources,
	dashboardDetailDefinitions.dailyExpenses,
] as const satisfies readonly DashboardDetailDefinition[];
