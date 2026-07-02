export type DashboardDetailKey =
	| "monthlyOutflow"
	| "entries"
	| "averageTicket"
	| "savingsRate"
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
	monthlyOutflow: {
		key: "monthlyOutflow",
		path: "/dashboard/monthly-outflow",
		title: "Saídas do mês",
		description: "Acompanhe a leitura consolidada das saídas registradas no período atual.",
		scaffoldTitle: "Análise mensal de saídas",
		scaffoldDescription:
			"Esta aba vai concentrar o detalhamento das saídas do mês, tendências recentes e recortes por período.",
	},
	entries: {
		key: "entries",
		path: "/dashboard/entries",
		title: "Lançamentos",
		description: "Veja o volume de lançamentos e a evolução da atividade financeira recente.",
		scaffoldTitle: "Detalhamento de lançamentos",
		scaffoldDescription:
			"Esta aba vai expandir os lançamentos com cortes por período, origem e variações de atividade.",
	},
	averageTicket: {
		key: "averageTicket",
		path: "/dashboard/average-ticket",
		title: "Ticket médio",
		description: "Analise a média financeira por lançamento e sua variação ao longo do tempo.",
		scaffoldTitle: "Visão detalhada do ticket médio",
		scaffoldDescription:
			"Esta aba vai aprofundar o ticket médio com comparativos, recortes temporais e distribuição de valores.",
	},
	savingsRate: {
		key: "savingsRate",
		path: "/dashboard/savings-rate",
		title: "Taxa de economia",
		description: "Entenda o ritmo de economia atual e como ele se compara aos ciclos anteriores.",
		scaffoldTitle: "Leitura da taxa de economia",
		scaffoldDescription:
			"Esta aba vai reunir a taxa de economia com histórico, metas e indicadores de estabilidade financeira.",
	},
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
		title: "Traffic sources",
		description: "Visualize os principais canais de origem e a relevância de cada fonte no período.",
		scaffoldTitle: "Leitura de traffic sources",
		scaffoldDescription:
			"Esta aba vai expandir as origens de tráfego com evolução histórica, ranking e cortes por canal.",
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
	dashboardDetailDefinitions.monthlyOutflow,
	dashboardDetailDefinitions.entries,
	dashboardDetailDefinitions.averageTicket,
	dashboardDetailDefinitions.savingsRate,
	dashboardDetailDefinitions.monthlyBills,
	dashboardDetailDefinitions.expenseDistribution,
	dashboardDetailDefinitions.trafficSources,
	dashboardDetailDefinitions.dailyExpenses,
	dashboardDetailDefinitions.investments,
] as const satisfies readonly DashboardDetailDefinition[];
