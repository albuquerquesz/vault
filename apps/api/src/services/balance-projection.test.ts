import { describe, expect, test } from "bun:test";
import {
	averageVariable,
	buildAssumptions,
	currentMonthVariableRemaining,
	type ProjectionInput,
	projectBalance,
} from "./balance-projection.js";

const base: ProjectionInput = {
	startBalance: 1000,
	today: "2026-11-20",
	months: 3,
	recurringItems: [],
	currentOccurrences: [],
	closedBills: [],
	openBills: [],
	installmentsByMonth: new Map(),
	bankVariableMonthly: 0,
	bankVariableCurrentRemaining: 0,
	cardVariableMonthly: 0,
};

const item = (over: Record<string, unknown>) => ({
	id: "i1",
	kind: "bill" as const,
	name: "Aluguel",
	amount: 500,
	dayOfMonth: 5,
	startMonth: "2026-01",
	endMonth: null,
	category: "Moradia",
	matchText: null,
	...over,
});

const month = (result: ReturnType<typeof projectBalance>, value: string) =>
	result.months.find((entry) => entry.month === value)!;

describe("projectBalance", () => {
	test("sem conta bancária devolve vazio e startBalance nulo", () => {
		const result = projectBalance({ ...base, startBalance: null });
		expect(result).toMatchObject({ startBalance: null, months: [], days: [], firstNegativeMonth: null });
		expect(buildAssumptions({ hasBankBalance: false } as never)[0]?.code).toBe("NO_BANK_ACCOUNT");
	});

	test("lista um mês por horizonte, começando no atual", () => {
		const result = projectBalance(base);
		expect(result.months.map((entry) => entry.month)).toEqual(["2026-11", "2026-12", "2027-01"]);
		expect(result.days[0]).toEqual({ date: "2026-11-20", balance: 1000 });
		expect(result.days.at(-1)?.date).toBe("2027-01-31");
		expect(month(result, "2027-01").endBalance).toBe(1000);
	});

	test("conta fixa e receita recorrente entram no dia, uma vez por mês", () => {
		const result = projectBalance({
			...base,
			recurringItems: [item({}), item({ id: "i2", kind: "income", name: "Pró-labore", amount: 3000, dayOfMonth: 10 })],
		});
		expect(month(result, "2026-12")).toMatchObject({ fixedBills: 500, income: 3000, endBalance: 3500 });
		expect(month(result, "2027-01")).toMatchObject({ fixedBills: 500, income: 3000, endBalance: 6000 });
		// Day 5 and day 10 of November are in the past: only the current month's pending items count.
		expect(month(result, "2026-11")).toMatchObject({ fixedBills: 0, income: 0 });
	});

	test("no mês atual só o que está pendente entra, e atrasado vira amanhã", () => {
		const pending = { ...item({}), month: "2026-11", dueDate: "2026-11-05", status: "expected" as const, matchedTransaction: null };
		const done = { ...item({ id: "i3", name: "Internet", amount: 100 }), month: "2026-11", dueDate: "2026-11-08", status: "realized" as const, matchedTransaction: { id: "t", date: "2026-11-08", amount: -100 } };
		const result = projectBalance({ ...base, currentOccurrences: [pending, done], recurringItems: [item({})] });
		expect(month(result, "2026-11").fixedBills).toBe(500);
		expect(result.days.find((day) => day.date === "2026-11-21")?.balance).toBe(500);
	});

	test("fatura fechada é fato e entra pelo que falta pagar, no vencimento", () => {
		const result = projectBalance({
			...base,
			closedBills: [{ dueDate: "2026-12-10", remaining: 400, label: "Fatura gold" }],
		});
		expect(month(result, "2026-12")).toMatchObject({ closedCardBills: 400, endBalance: 600 });
		expect(result.events.find((event) => event.kind === "closed_card_bill")?.certainty).toBe("fact");
	});

	test("fatura em aberto vale o maior entre o estimado e o mês de cartão típico", () => {
		const open = [{ dueDate: "2026-12-10", estimatedTotal: 200, label: "Aberta" }];
		const low = projectBalance({ ...base, openBills: open, cardVariableMonthly: 300, installmentsByMonth: new Map([["2026-12", 100]]) });
		expect(month(low, "2026-12").openCardBill).toBe(400);
		const high = projectBalance({ ...base, openBills: [{ ...open[0]!, estimatedTotal: 900 }], cardVariableMonthly: 300 });
		expect(month(high, "2026-12").openCardBill).toBe(900);
		// The month after the open bill falls back to the average plus installments, counted once.
		expect(month(high, "2027-01")).toMatchObject({ cardSpending: 300, openCardBill: 0 });
	});

	test("meses sem fatura conhecida usam média e parcelas, e fatura fechada não soma a média", () => {
		const result = projectBalance({
			...base,
			cardVariableMonthly: 300,
			installmentsByMonth: new Map([["2026-12", 80], ["2027-01", 80]]),
			closedBills: [{ dueDate: "2026-12-10", remaining: 400, label: "Fatura" }],
		});
		expect(month(result, "2026-12")).toMatchObject({ closedCardBills: 400, cardSpending: 0, installments: 0 });
		expect(month(result, "2027-01")).toMatchObject({ cardSpending: 300, installments: 80 });
		// The current month has no card line: what is bought now goes to a later bill.
		expect(month(result, "2026-11")).toMatchObject({ cardSpending: 0, installments: 0 });
	});

	test("gasto variável sai um pouco por dia e fecha com o total do mês", () => {
		const result = projectBalance({ ...base, bankVariableMonthly: 3000, bankVariableCurrentRemaining: 900 });
		expect(month(result, "2026-11").variable).toBe(900);
		expect(month(result, "2026-12").variable).toBe(3000);
		expect(month(result, "2026-12").endBalance).toBe(-2900);
	});

	test("saldo negativo preenche o primeiro mês e dia negativos e o ponto mais baixo", () => {
		const result = projectBalance({ ...base, recurringItems: [item({ amount: 700 })] });
		expect(result.firstNegativeMonth).toBe("2027-01");
		expect(result.firstNegativeDate).toBe("2027-01-05");
		expect(result.lowest).toEqual({ date: "2027-01-05", balance: -400 });
		const fine = projectBalance({ ...base, recurringItems: [item({ amount: 50 })] });
		expect(fine.firstNegativeMonth).toBeNull();
	});

	test("conta fixa respeita início e fim e ajusta o dia 31 em fevereiro", () => {
		const result = projectBalance({
			...base,
			today: "2027-01-20",
			months: 3,
			recurringItems: [item({ dayOfMonth: 31, startMonth: "2027-02", endMonth: "2027-02" })],
		});
		expect(month(result, "2027-01").fixedBills).toBe(0);
		expect(month(result, "2027-02").fixedBills).toBe(500);
		expect(result.events.find((event) => event.kind === "fixed_bill")?.date).toBe("2027-02-28");
		expect(month(result, "2027-03").fixedBills).toBe(0);
	});

	test("hoje no último dia do mês: o mês atual fica sem movimento", () => {
		const result = projectBalance({ ...base, today: "2026-11-30", months: 2, bankVariableMonthly: 3100 });
		expect(month(result, "2026-11").endBalance).toBe(1000);
		expect(month(result, "2026-12").variable).toBe(3100);
	});
});

describe("médias e ritmo", () => {
	test("média usa só os meses com dados e avisa quando falta histórico", () => {
		expect(averageVariable([{ bank: 0, card: 0, hasData: false }, { bank: 100, card: 40, hasData: true }, { bank: 300, card: 60, hasData: true }])).toEqual({ bank: 200, card: 50, monthsUsed: 2 });
		expect(averageVariable([])).toEqual({ bank: 0, card: 0, monthsUsed: 0 });
	});

	test("mês atual: média proporcional nos primeiros dias e ritmo quando passa da média", () => {
		expect(currentMonthVariableRemaining({ monthlyAverage: 3000, spentSoFar: 50, daysElapsed: 3, daysInMonth: 30 })).toEqual({ amount: 2700, basis: "average" });
		// R$ 1.000 in 10 days is R$ 3.000 in the month: R$ 2.000 to go, above the R$ 1.800 from the average.
		expect(currentMonthVariableRemaining({ monthlyAverage: 2700, spentSoFar: 1000, daysElapsed: 10, daysInMonth: 30 })).toEqual({ amount: 2000, basis: "pace" });
		expect(currentMonthVariableRemaining({ monthlyAverage: 2700, spentSoFar: 100, daysElapsed: 10, daysInMonth: 30 })).toEqual({ amount: 1800, basis: "average" });
	});

	test("premissas avisam quando falta renda, conta fixa ou histórico", () => {
		const codes = buildAssumptions({ hasBankBalance: true, historyMonths: 0, hasRecurringIncome: false, hasRecurringBills: false, hasCards: false, openBillWithoutDate: false, paceUsed: false, hasInstallments: false }).map((a) => a.code);
		expect(codes).toEqual(expect.arrayContaining(["NO_INCOME", "NO_FIXED_BILLS", "NO_HISTORY", "NOT_COVERED"]));
	});
});
