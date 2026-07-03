export type DashboardDetailKey =
	| "monthlyBills"
	| "dailyExpenses"
	| "expenseDistribution"
	| "trafficSources"
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
		description:
			"Acompanhe a composição das faturas atuais, parcelas e consumo do limite.",
		scaffoldTitle: "Central de faturas",
		scaffoldDescription:
			"Esta aba vai detalhar as faturas do mês com histórico, parcelas, gastos avulsos e uso do limite.",
	},
	dailyExpenses: {
		key: "dailyExpenses",
		path: "/dashboard/daily-expenses",
		title: "Despesas diárias",
		description:
			"Veja quando os gastos se concentram ao longo dos dias e das faixas horárias.",
		scaffoldTitle: "Mapa diário de despesas",
		scaffoldDescription:
			"Esta aba vai reunir a distribuição diária dos gastos com detalhes por dia e hora.",
	},
	expenseDistribution: {
		key: "expenseDistribution",
		path: "/dashboard/expense-distribution",
		title: "Distribuição dos gastos",
		description:
			"Veja como os gastos se distribuem entre categorias e setores.",
		scaffoldTitle: "Distribuição dos gastos",
		scaffoldDescription:
			"Esta aba vai detalhar a distribuição dos gastos por categoria e setor.",
	},
	trafficSources: {
		key: "trafficSources",
		path: "/dashboard/traffic-sources",
		title: "Canais de origem",
		description: "Acompanhe a origem do tráfego e o desempenho por canal.",
		scaffoldTitle: "Canais de origem",
		scaffoldDescription:
			"Esta aba vai detalhar os canais de origem do tráfego e seu desempenho.",
	},
	investments: {
		key: "investments",
		path: "/dashboard/investments",
		title: "Investimentos",
		description: "Acompanhe o desempenho dos seus investimentos.",
		scaffoldTitle: "Investimentos",
		scaffoldDescription:
			"Esta aba vai detalhar o desempenho dos seus investimentos.",
	},
} as const satisfies Record<DashboardDetailKey, DashboardDetailDefinition>;

export const dashboardDetailList = Object.values(dashboardDetailDefinitions);
