import { describe, expect, test } from "bun:test";
import {
	type CategoryRuleLike,
	firstMatchingRule,
	resolveDisplayCategory,
	ruleMatches,
} from "./category-rules.js";
import { classifyPluggyTransactions } from "./pluggy-classification.js";

const rule = (over: Partial<CategoryRuleLike> = {}): CategoryRuleLike => ({
	id: "r1",
	matchType: "contains",
	pattern: "ifood",
	category: "Delivery",
	priority: 1,
	enabled: true,
	...over,
});

describe("casamento de regra", () => {
	test("contains ignora caixa, acento e espaços repetidos", () => {
		expect(ruleMatches(rule(), "Pagamento  IFOOD *Restaurante")).toBe(true);
		expect(ruleMatches(rule({ pattern: "padaria sao joao" }), "PADARIA  São João")).toBe(true);
		expect(ruleMatches(rule(), "Uber")).toBe(false);
	});

	test("starts_with só casa no começo", () => {
		const r = rule({ matchType: "starts_with", pattern: "uber" });
		expect(ruleMatches(r, "Uber *Trip")).toBe(true);
		expect(ruleMatches(r, "Pagamento Uber")).toBe(false);
	});

	test("equals exige o texto inteiro", () => {
		const r = rule({ matchType: "equals", pattern: "Netflix" });
		expect(ruleMatches(r, " netflix ")).toBe(true);
		expect(ruleMatches(r, "Netflix.com")).toBe(false);
	});

	test("padrão vazio e descrição nula não casam", () => {
		expect(ruleMatches(rule({ pattern: "  " }), "qualquer")).toBe(false);
		expect(ruleMatches(rule(), null)).toBe(false);
	});
});

describe("precedência", () => {
	test("vence a regra de menor priority; empate vai para a mais antiga", () => {
		const rules = [
			rule({ id: "a", priority: 5, category: "A" }),
			rule({ id: "b", priority: 2, category: "B", createdAt: new Date(5) }),
			rule({ id: "c", priority: 2, category: "C", createdAt: new Date(1) }),
		];
		expect(firstMatchingRule(rules, "ifood")?.id).toBe("c");
		expect(firstMatchingRule(rules.slice(0, 2), "ifood")?.id).toBe("b");
	});

	test("regra desativada não casa", () => {
		expect(firstMatchingRule([rule({ enabled: false })], "ifood")).toBeUndefined();
	});

	test("categoria manual vence a regra, que vence a do banco", () => {
		const base = { description: "IFOOD", original: "Eating out", rules: [rule()] };
		expect(resolveDisplayCategory({ ...base, override: "Mercado" })).toBe("Mercado");
		expect(resolveDisplayCategory({ ...base, override: null })).toBe("Delivery");
		expect(resolveDisplayCategory({ ...base, override: "  ", rules: [] })).toBe("Eating out");
		expect(resolveDisplayCategory({ ...base, override: null, original: null, rules: [] })).toBe("Outros");
	});
});

describe("a regra não muda a classificação", () => {
	test("a classificação só enxerga a categoria original", () => {
		const tx = {
			id: "t1",
			date: "2026-11-10",
			amount: -50,
			category: "Same person transfer",
			description: "IFOOD",
			accountType: "BANK",
			accountId: "a1",
		};
		const before = classifyPluggyTransactions([tx]).get("t1");
		// A rule would show "Delivery", but the classifier input is unchanged.
		expect(resolveDisplayCategory({ override: null, original: tx.category, description: tx.description, rules: [rule()] })).toBe("Delivery");
		expect(classifyPluggyTransactions([tx]).get("t1")).toEqual(before);
		expect(before?.kind).toBe("ignored");
	});
});
