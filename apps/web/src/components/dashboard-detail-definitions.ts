export type DashboardDetailKey =
	| "monthlyBills"
	| "expenseDistribution"
	| "trafficSources"
	| "dailyExpenses"
	| "investments";

export type DashboardDetailDefinition = {
	key: DashboardDetailKey;
	path: string;
	title: string;
	description: string;
	scaffoldTitle: string;
	scaffoldDescription: string;
};

export const dashboardDetailDefinitions = {
	monthlyBills: {
		key: "monthlyBills",
		path: "/dashboard/monthly-bills",
		title: "Faturas do mês",
		description: "Acompanhe a composição das faturas atuais, parcelas e consumo do limite.",
		scaffoldTitle: "Central de faturas",
		scaffoldDescription:
			"Esta aba vai detalhar as faturas do mês com histórico, parcelas, gastos avulsos e uso do limite.",
	},
	expenseDistribution: {
		key: "expenseDistribution",
		path: "/dashboard/expense-distribution",
		title: "Distribuição dos gastos",
		description: "Explore a participação de cada origem nas despesas consolidadas do período.",
		scaffoldTitle: "Mapa de distribuição de gastos",
		scaffoldDescription:
			"Esta aba vai aprofundar a distribuição dos gastos com participação por origem e comparativos mensais.",
	},
	trafficSources: {
		key: "trafficSources",
		path: "/dashboard/traffic-sources",
		title: "Canais de origem",
		description: "Visualize os principais canais de origem e a relevância de cada fonte no período.",
		scaffoldTitle: "Leitura dos canais de origem",
		scaffoldDescription:
			"Esta aba vai expandir os canais de origem com evolução histórica, ranking e cortes por canal.",
	},
	dailyExpenses: {
		key: "dailyExpenses",
		path: "/dashboard/daily-expenses",
		title: "Despesas diárias",
		description: "Veja quando os gastos se concentram ao longo dos dias e das faixas horárias.",
		scaffoldTitle: "Mapa diário de despesas",
		scaffoldDescription:
			"Esta aba vai reunir a distribuição diária dos gastos com destaque para picos, médias e horários críticos.",
	},
	investments: {
		key: "investments",
		path: "/dashboard/investments",
		title: "Investimentos",
		description: "Acompanhe a evolução do capital investido e do rendimento consolidado.",
		scaffoldTitle: "Painel de investimentos",
		scaffoldDescription:
			"Esta aba vai detalhar patrimônio investido, rendimento acumulado e evolução mensal da carteira.",
	},
} satisfies Record<DashboardDetailKey, DashboardDetailDefinition>;

export const dashboardDetailList = [
	dashboardDetailDefinitions.monthlyBills,
	dashboardDetailDefinitions.expenseDistribution,
	dashboardDetailDefinitions.trafficSources,
	dashboardDetailDefinitions.dailyExpenses,
	dashboardDetailDefinitions.investments,
] as const satisfies readonly DashboardDetailDefinition[];
