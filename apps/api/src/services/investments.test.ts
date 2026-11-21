import { describe, expect, test } from "bun:test";
import { isInvestmentsUnavailableError, normalizeInvestment, PluggyApiError } from "../clients/pluggy/index.js";
import { computeReturn, type InvestmentRow, summarizePortfolio } from "./investments.js";

const row = (over: Partial<InvestmentRow>): InvestmentRow => ({
	id: "1",
	name: "CDB",
	type: "FIXED_INCOME",
	subtype: "CDB",
	institution: "Nubank",
	amountInvested: 1000,
	balance: 1100,
	currency: "BRL",
	status: "ACTIVE",
	date: null,
	...over,
});

describe("normalizeInvestment", () => {
	test("mapeia uma posição de CDB do Open Finance (sem amountProfit)", () => {
		const parsed = normalizeInvestment({
			id: "abc",
			itemId: "item",
			name: "Cofrinho",
			type: "FIXED_INCOME",
			subtype: "CDB",
			balance: 2000,
			amountOriginal: 1000,
			amountProfit: null,
			currencyCode: "BRL",
			status: "ACTIVE",
			date: "2026-11-20T10:00:00.000Z",
			institution: { name: "Nu Pagamentos", number: "1" },
		});
		expect(parsed).toMatchObject({
			id: "abc",
			type: "FIXED_INCOME",
			amountInvested: 1000,
			amountProfit: null,
			institution: "Nu Pagamentos",
			currency: "BRL",
		});
	});

	test("tipo desconhecido vira OTHER; sem id ou saldo é descartado; lixo não quebra", () => {
		expect(normalizeInvestment({ id: "x", balance: 1, type: "NOVO" })?.type).toBe("OTHER");
		expect(normalizeInvestment({ id: "x" })).toBeNull();
		expect(normalizeInvestment({ balance: 5 })).toBeNull();
		expect(normalizeInvestment({ id: "x", balance: "5" })).toBeNull();
		expect(normalizeInvestment(null)).toBeNull();
		expect(normalizeInvestment("oi")).toBeNull();
		const odd = normalizeInvestment({ id: "x", balance: 1, date: "nao-data", amountOriginal: "abc" });
		expect(odd).toMatchObject({ date: null, amountInvested: null, name: "Investimento", currency: "BRL" });
	});
});

describe("isInvestmentsUnavailableError", () => {
	test("403 e mensagens de produto/plano contam; item não encontrado e 500 não", () => {
		expect(isInvestmentsUnavailableError(new PluggyApiError("Forbidden", 403, "{}"))).toBe(true);
		expect(isInvestmentsUnavailableError(new PluggyApiError("Product not enabled for your plan", 400, "{}"))).toBe(true);
		expect(isInvestmentsUnavailableError(new PluggyApiError("item not found", 404, "{}"))).toBe(false);
		expect(isInvestmentsUnavailableError(new PluggyApiError("boom", 500, "{}"))).toBe(false);
		expect(isInvestmentsUnavailableError(new Error("rede"))).toBe(false);
	});
});

describe("computeReturn", () => {
	test("(atual - aplicado) / aplicado; aplicado zero ou ausente não divide", () => {
		expect(computeReturn(1100, 1000)).toEqual({ amount: 100, percent: 10 });
		expect(computeReturn(900, 1000)).toEqual({ amount: -100, percent: -10 });
		expect(computeReturn(500, 0)).toBeNull();
		expect(computeReturn(500, null)).toBeNull();
	});
});

describe("summarizePortfolio", () => {
	test("carteira vazia", () => {
		const summary = summarizePortfolio([]);
		expect(summary).toMatchObject({ totalBalance: 0, returnAmount: null, returnPercent: null, byType: [], positions: [] });
	});

	test("dois do mesmo tipo somam na divisão por tipo, com percentual", () => {
		const summary = summarizePortfolio([
			row({ id: "1", balance: 1100 }),
			row({ id: "2", balance: 900, amountInvested: 800 }),
			row({ id: "3", type: "EQUITY", subtype: "STOCK", balance: 3000, amountInvested: 3000 }),
		]);
		expect(summary.totalBalance).toBe(5000);
		expect(summary.byType).toEqual([
			{ type: "EQUITY", label: "Ações e FIIs", balance: 3000, percent: 60, count: 1 },
			{ type: "FIXED_INCOME", label: "Renda fixa", balance: 2000, percent: 40, count: 2 },
		]);
		// invested 4800 vs balance 5000
		expect(summary.returnAmount).toBe(200);
		expect(summary.returnPercent).toBe(4.17);
	});

	test("sem valor aplicado: rentabilidade nula e fora da conta da carteira", () => {
		const summary = summarizePortfolio([
			row({ id: "1", balance: 1100, amountInvested: 1000 }),
			row({ id: "2", balance: 5000, amountInvested: null }),
		]);
		expect(summary.totalBalance).toBe(6100);
		expect(summary.returnAmount).toBe(100);
		expect(summary.positions.find((p) => p.id === "2")).toMatchObject({ returnAmount: null, returnPercent: null });
	});

	test("resgatados e moeda estrangeira ficam fora dos totais", () => {
		const summary = summarizePortfolio([
			row({ id: "1", balance: 1000 }),
			row({ id: "2", balance: 0, status: "TOTAL_WITHDRAWAL" }),
			row({ id: "3", balance: 300, currency: "USD" }),
		]);
		expect(summary.totalBalance).toBe(1000);
		expect(summary.redeemedCount).toBe(1);
		expect(summary.otherCurrencyCount).toBe(1);
		expect(summary.positions.map((p) => p.id).sort()).toEqual(["1", "3"]);
		expect(summary.positions.find((p) => p.id === "3")?.percent).toBeNull();
	});
});
