import { beforeEach, describe, expect, test } from "bun:test";
import { api, resetDatabase } from "./helpers.js";

beforeEach(resetDatabase);

const rent = {
	kind: "bill",
	name: "Aluguel",
	amount: 1500,
	dayOfMonth: 5,
	startMonth: "2026-10",
	category: "Moradia",
};

const create = async (over: Record<string, unknown> = {}) =>
	(await api("POST", "/recurring", { ...rent, ...over })).json.id as string;

const month = async (value: string) => (await api("GET", `/recurring?month=${value}`)).json;

describe("contas fixas e receitas recorrentes", () => {
	test("cadastra e lista no mês com o dia ajustado e o status esperado", async () => {
		const id = await create({ dayOfMonth: 31 });

		const feb = await month("2027-02");
		expect(feb.items).toHaveLength(1);
		expect(feb.items[0]).toMatchObject({ id, dueDate: "2027-02-28", status: "expected", amount: 1500 });
		expect(feb.summary).toMatchObject({ billsPlanned: 1500, billsPending: 1500 });
	});

	test("não aparece antes do início nem depois do fim", async () => {
		await create({ startMonth: "2026-11", endMonth: "2026-12" });

		expect((await month("2026-10")).items).toHaveLength(0);
		expect((await month("2026-11")).items).toHaveLength(1);
		expect((await month("2026-12")).items).toHaveLength(1);
		expect((await month("2027-01")).items).toHaveLength(0);
	});

	test("uma transação real parecida deixa o item realizado e fora do pendente", async () => {
		await create();
		await api("POST", "/transactions/manual", {
			kind: "expense",
			date: "2026-12-05",
			amount: 1510,
			category: "Moradia",
			note: "PIX ALUGUEL JOAO",
		});

		const result = await month("2026-12");
		expect(result.items[0].status).toBe("realized");
		expect(result.items[0].matchedTransaction.amount).toBe(-1510);
		expect(result.summary).toMatchObject({ billsPlanned: 1500, billsPending: 0 });
	});

	test("marcar como pago, desmarcar e o mês em que o item não vale", async () => {
		const id = await create({ startMonth: "2026-11", endMonth: "2026-12" });

		const paid = await api("POST", `/recurring/${id}/paid`, { month: "2026-12" });
		expect(paid.json).toMatchObject({ paid: true });
		expect((await month("2026-12")).items[0].status).toBe("paid_manual");
		// Marking twice is harmless.
		expect((await api("POST", `/recurring/${id}/paid`, { month: "2026-12" })).status).toBe(200);

		const outside = await api("POST", `/recurring/${id}/paid`, { month: "2027-03" });
		expect(outside.status).toBe(400);

		const cleared = await api("DELETE", `/recurring/${id}/paid`, { month: "2026-12" });
		expect(cleared.json.cleared).toBe(true);
		expect((await month("2026-12")).items[0].status).toBe("expected");
	});

	test("mudar o valor daqui para a frente preserva os meses passados", async () => {
		const id = await create();

		const result = await api("PATCH", `/recurring/${id}`, { amount: 1700, effectiveFrom: "2027-01" });
		expect(result.status).toBe(200);
		expect(result.json.previous).toMatchObject({ id, endMonth: "2026-12", amount: 1500 });
		expect(result.json.item).toMatchObject({ startMonth: "2027-01", amount: 1700, endMonth: null });

		expect((await month("2026-12")).items.map((i: { amount: number }) => i.amount)).toEqual([1500]);
		expect((await month("2027-01")).items.map((i: { amount: number }) => i.amount)).toEqual([1700]);
	});

	test("sem 'a partir de', a edição corrige o item inteiro", async () => {
		const id = await create();
		await api("PATCH", `/recurring/${id}`, { amount: 1600, name: "Aluguel (corrigido)" });

		const result = await month("2026-12");
		expect(result.items).toHaveLength(1);
		expect(result.items[0]).toMatchObject({ amount: 1600, name: "Aluguel (corrigido)" });
	});

	test("encerrar com o mês final preserva o histórico e 'all' ainda acha o item", async () => {
		const id = await create();
		await api("PATCH", `/recurring/${id}`, { endMonth: "2026-11" });

		expect((await month("2026-12")).items).toHaveLength(0);
		expect((await month("2026-11")).items).toHaveLength(1);
		const all = await api("GET", "/recurring?all=true");
		expect(all.json.items).toHaveLength(1);
		expect(all.json.items[0].endMonth).toBe("2026-11");
	});

	test("receita recorrente também casa, e só com dinheiro que entra", async () => {
		await create({ kind: "income", name: "Salário", amount: 5000, dayOfMonth: 1, category: "Salário" });
		await api("POST", "/transactions/manual", { kind: "expense", date: "2026-12-01", amount: 5000, category: "Salário", note: "Salário" });
		expect((await month("2026-12")).items[0].status).toBe("expected");

		await api("POST", "/transactions/manual", { kind: "income", date: "2026-12-01", amount: 5000, category: "Salário", note: "SALARIO EMPRESA" });
		const result = await month("2026-12");
		expect(result.items[0].status).toBe("realized");
		expect(result.summary).toMatchObject({ incomePlanned: 5000, incomePending: 0 });
	});

	test("apagar remove o item e as marcações; item inexistente é 404", async () => {
		const id = await create({ startMonth: "2026-11" });
		await api("POST", `/recurring/${id}/paid`, { month: "2026-12" });

		expect((await api("DELETE", `/recurring/${id}`)).json.deleted).toBe(1);
		expect((await api("GET", "/recurring?all=true")).json.items).toHaveLength(0);
		expect((await api("DELETE", `/recurring/${id}`)).status).toBe(404);
		expect((await api("PATCH", `/recurring/${id}`, { amount: 1 })).status).toBe(404);
	});

	test("valores inválidos são recusados", async () => {
		expect((await api("POST", "/recurring", { ...rent, dayOfMonth: 32 })).status).toBe(400);
		expect((await api("POST", "/recurring", { ...rent, amount: 0 })).status).toBe(400);
		expect((await api("POST", "/recurring", { ...rent, kind: "loan" })).status).toBe(400);
		expect((await api("POST", "/recurring", { ...rent, startMonth: "2026-12", endMonth: "2026-11" })).status).toBe(400);
		const id = await create();
		expect((await api("PATCH", `/recurring/${id}`, {})).status).toBe(400);
		expect((await api("GET", "/recurring?month=2026-13")).status).toBe(400);
	});
});
