import { beforeEach, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../src/db/index.js";
import {
	categoryRule,
	expense,
	pluggyAccounts,
	pluggyItems,
	pluggyTransactions,
	transactionTag,
} from "../src/db/schema/index.js";
import { api, resetDatabase, TEST_USER_ID } from "./helpers.js";

beforeEach(resetDatabase);

async function seedBank(
	rows: {
		description: string;
		amount: string;
		category: string;
		override?: string;
		date?: string;
	}[],
) {
	const [item] = await db
		.insert(pluggyItems)
		.values({ userId: TEST_USER_ID, pluggyItemId: "pi-1", provider: "Teste" })
		.returning();
	const [account] = await db
		.insert(pluggyAccounts)
		.values({ pluggyItemId: item!.id, pluggyAccountId: "pa-1", type: "BANK", name: "Conta" })
		.returning();
	const ids: string[] = [];
	for (const [index, row] of rows.entries()) {
		const [inserted] = await db
			.insert(pluggyTransactions)
			.values({
				pluggyItemId: item!.id,
				pluggyAccountId: account!.id,
				pluggyTransactionId: `pt-${index}`,
				date: row.date ?? "2026-12-10",
				amount: row.amount,
				description: row.description,
				category: row.category,
				categoryOverride: row.override ?? null,
			})
			.returning();
		ids.push(inserted!.id);
	}
	// Same path a sync takes: expense rows derived from the stored transactions.
	await api("POST", "/category-rules/apply", {});
	return ids;
}

const list = async (month = "2026-12", extra = "") =>
	(await api("GET", `/transactions?month=${month}${extra}`)).json as {
		id: string;
		category: string;
		description: string | null;
		amount: number;
		kind: string;
		tags: { id: string; name: string }[];
	}[];

const categoryOf = async (id: string, month = "2026-12") =>
	(await list(month)).find((tx) => tx.id === id)?.category;

const bankExpenseCategories = async () =>
	(await db.select().from(expense).where(eq(expense.source, "pluggy"))).map((row) => row.category).sort();

describe("regras de categoria", () => {
	test("a regra muda o nome exibido, não o gasto, e a manual vence", async () => {
		const [ifood, , byHand, transfer] = await seedBank([
			{ description: "IFOOD *PEDIDO", amount: "-50.00", category: "Restaurants" },
			{ description: "Padaria", amount: "-10.00", category: "Bakery" },
			{ description: "IFOOD OUTRO", amount: "-30.00", category: "Restaurants", override: "Mercado" },
			// Own money moving between accounts: never spending, whatever the rule says.
			{ description: "IFOOD", amount: "-100.00", category: "Same person transfer" },
		]);
		const before = (await api("GET", "/partial-result?month=2026-12")).json;

		const created = await api("POST", "/category-rules", {
			matchType: "contains",
			pattern: "ifood",
			category: "Delivery",
		});
		expect(created.status).toBe(201);

		expect(await categoryOf(ifood!)).toBe("Delivery");
		expect(await categoryOf(byHand!)).toBe("Mercado");
		expect(await categoryOf(transfer!)).toBeUndefined();
		// The stored (derived) rows follow the rule too.
		expect(await bankExpenseCategories()).toEqual(["Bakery", "Delivery", "Mercado"]);

		const after = (await api("GET", "/partial-result?month=2026-12")).json;
		expect(after).toEqual(before);

		const chart = (await api("GET", "/chart?metric=spending_by_category&month=2026-12")).json;
		expect(chart.data.find((point: { label: string }) => point.label === "Delivery").value).toBe(50);
	});

	test("rege os limites por categoria e não toca lançamento manual", async () => {
		await seedBank([{ description: "IFOOD", amount: "-50.00", category: "Restaurants" }]);
		await api("POST", "/transactions/manual", { kind: "expense", date: "2026-12-11", amount: 20, category: "Lazer", note: "ifood com a turma" });
		await api("POST", "/category-limits", { month: "2026-12", category: "delivery", targetAmount: 40 });
		await api("POST", "/category-rules", { matchType: "contains", pattern: "ifood", category: "Delivery" });

		const limits = (await api("GET", "/category-limits?month=2026-12")).json.limits;
		expect(limits[0]).toMatchObject({ spent: 50, isOver: true });
		expect((await list()).find((tx) => tx.description === "ifood com a turma")?.category).toBe("Lazer");
	});

	test("prioridade, desativar e apagar", async () => {
		const [id] = await seedBank([{ description: "UBER *TRIP IFOOD", amount: "-20.00", category: "Taxi" }]);
		const a = (await api("POST", "/category-rules", { matchType: "contains", pattern: "uber", category: "Transporte" })).json;
		const b = (await api("POST", "/category-rules", { matchType: "contains", pattern: "ifood", category: "Delivery", priority: 0 })).json;
		expect(await categoryOf(id!)).toBe("Delivery");

		expect((await api("GET", "/category-rules")).json.map((r: { id: string }) => r.id)).toEqual([b.id, a.id]);

		await api("PATCH", `/category-rules/${b.id}`, { enabled: false });
		expect(await categoryOf(id!)).toBe("Transporte");
		expect((await api("PATCH", `/category-rules/${b.id}`, {})).status).toBe(400);

		await api("PATCH", `/category-rules/${a.id}`, { matchType: "starts_with", pattern: "uber" });
		expect(await categoryOf(id!)).toBe("Transporte");
		await api("PATCH", `/category-rules/${a.id}`, { matchType: "equals" });
		expect(await categoryOf(id!)).toBe("Taxi");

		expect((await api("DELETE", `/category-rules/${a.id}`)).json).toEqual({ deleted: 1 });
		expect((await api("DELETE", `/category-rules/${a.id}`)).status).toBe(404);
		expect(await bankExpenseCategories()).toEqual(["Taxi"]);
	});

	test("preview conta sem gravar e ignora o que não conta como gasto", async () => {
		await seedBank([
			{ description: "IFOOD 1", amount: "-50.00", category: "Restaurants" },
			{ description: "IFOOD 2", amount: "-30.00", category: "Delivery" },
			{ description: "IFOOD 3", amount: "-30.00", category: "Restaurants", override: "Mercado" },
			{ description: "IFOOD 4", amount: "-30.00", category: "Investments" },
		]);
		const preview = await api("POST", "/category-rules/preview", { matchType: "contains", pattern: "ifood", category: "Delivery" });
		expect(preview.json.matched).toBe(2);
		expect(preview.json.wouldChange).toBe(1);
		expect(preview.json.examples).toHaveLength(1);
		expect(preview.json.examples[0]).toMatchObject({ description: "IFOOD 1", currentCategory: "Restaurants", amount: -50 });
		expect(await db.select().from(categoryRule)).toHaveLength(0);
		expect((await api("POST", "/category-rules/preview", { matchType: "contains", pattern: "" })).status).toBe(400);
	});

	test("apply informa quantas vêm de regra", async () => {
		await seedBank([
			{ description: "IFOOD 1", amount: "-50.00", category: "Restaurants" },
			{ description: "Outro", amount: "-5.00", category: "Bakery" },
		]);
		await api("POST", "/category-rules", { matchType: "contains", pattern: "ifood", category: "Delivery" });
		expect((await api("POST", "/category-rules/apply", {})).json).toEqual({ categorizedByRules: 1 });
	});
});

describe("categorias próprias", () => {
	test("criar não duplica por caixa, acento ou espaço", async () => {
		expect((await api("POST", "/categories", { name: "Alimentação" })).status).toBe(201);
		const clash = await api("POST", "/categories", { name: "  alimentacao " });
		expect(clash.status).toBe(409);
		expect(clash.json.code).toBe("CONFLICT");
		expect((await api("POST", "/categories", { name: "Viagem  longa" })).json.name).toBe("Viagem longa");
		expect((await api("POST", "/categories", { name: "viagem longa" })).status).toBe(409);

		const catalog = (await api("GET", "/categories")).json;
		expect(catalog.find((c: { category: string }) => c.category === "Alimentação")).toMatchObject({ count: 0, archived: false });
	});

	async function seedEverywhere() {
		const [shopping, overridden] = await seedBank([
			{ description: "LOJA", amount: "-40.00", category: "Shopping" },
			{ description: "OUTRA", amount: "-15.00", category: "Other", override: "Mercado" },
		]);
		await api("POST", "/transactions/manual", { kind: "expense", date: "2026-12-12", amount: 25, category: "mercado" });
		await api("POST", "/category-limits", { month: "2026-12", category: "Mercado", targetAmount: 300 });
		await api("POST", "/recurring", { kind: "bill", name: "Feira", amount: 100, dayOfMonth: 3, category: "MERCADO" });
		await api("POST", "/category-rules", { matchType: "contains", pattern: "padaria", category: "Mercado" });
		return { shopping: shopping!, overridden: overridden! };
	}

	test("renomear atualiza tudo que usava o nome, inclusive o nome do banco", async () => {
		const { overridden } = await seedEverywhere();
		const renamed = await api("POST", "/categories/rename", { name: "mercado", newName: "Supermercado" });
		expect(renamed.status).toBe(200);
		expect(renamed.json.updated).toMatchObject({ manualTransactions: 1, bankTransactions: 1, rules: 1, limits: 1, recurringItems: 1 });

		expect(await categoryOf(overridden)).toBe("Supermercado");
		const txs = await list();
		expect(txs.find((tx) => tx.amount === -25)?.category).toBe("Supermercado");
		expect((await api("GET", "/category-limits?month=2026-12")).json.limits[0].category).toBe("Supermercado");
		expect((await api("GET", "/category-rules")).json[0].category).toBe("Supermercado");
		expect((await api("GET", "/recurring?all=true")).json.items[0].category).toBe("Supermercado");

		// A name only the bank used can be renamed too.
		await api("POST", "/categories/rename", { name: "Shopping", newName: "Compras" });
		expect((await list()).some((tx) => tx.category === "Compras")).toBe(true);
	});

	test("renomear para um nome que já existe no catálogo é recusado sem alterar nada", async () => {
		await seedEverywhere();
		await api("POST", "/categories", { name: "Supermercado" });
		const refused = await api("POST", "/categories/rename", { name: "Mercado", newName: "supermercado" });
		expect(refused.status).toBe(409);
		expect((await list()).filter((tx) => tx.category === "Supermercado")).toHaveLength(0);
		expect((await api("GET", "/category-rules")).json[0].category).toBe("Mercado");
	});

	test("juntar deixa uma só; o limite do destino é mantido", async () => {
		await seedEverywhere();
		await api("POST", "/categories", { name: "Mercado" });
		await api("POST", "/category-limits", { month: "2026-12", category: "Feira", targetAmount: 50 });
		await api("POST", "/transactions/manual", { kind: "expense", date: "2026-12-13", amount: 5, category: "Feira" });

		const merged = await api("POST", "/categories/merge", { from: "Mercado", into: "Feira" });
		expect(merged.status).toBe(200);
		const limits = (await api("GET", "/category-limits?month=2026-12")).json.limits;
		expect(limits).toHaveLength(1);
		expect(limits[0]).toMatchObject({ category: "Feira", targetAmount: 50 });
		const names = (await api("GET", "/categories")).json.map((c: { category: string }) => c.category.toLowerCase());
		expect(names).not.toContain("mercado");
		expect((await api("POST", "/categories/merge", { from: "Feira", into: "feira" })).status).toBe(400);
	});

	test("apagar em uso exige moveTo e, sem ele, não altera nada", async () => {
		await seedEverywhere();
		const refused = await api("DELETE", "/categories", { name: "Mercado" });
		expect(refused.status).toBe(409);
		expect((await api("GET", "/category-rules")).json[0].category).toBe("Mercado");
		expect((await list()).filter((tx) => tx.category.toLowerCase() === "mercado")).toHaveLength(2);

		const done = await api("DELETE", "/categories", { name: "Mercado", moveTo: "Casa" });
		expect(done.status).toBe(200);
		expect((await list()).filter((tx) => tx.category === "Casa")).toHaveLength(2);
		expect((await api("GET", "/category-limits?month=2026-12")).json.limits[0].category).toBe("Casa");
	});

	test("apagar sem uso sai do catálogo; inexistente dá 404; arquivar esconde", async () => {
		await api("POST", "/categories", { name: "Pets" });
		await api("POST", "/categories", { name: "Hobby" });
		expect((await api("POST", "/categories/archive", { name: "hobby", archived: true })).json.archived).toBe(true);
		const visible = (await api("GET", "/categories")).json.map((c: { category: string }) => c.category);
		expect(visible).toContain("Pets");
		expect(visible).not.toContain("Hobby");
		const all = (await api("GET", "/categories?archived=true")).json.map((c: { category: string }) => c.category);
		expect(all).toContain("Hobby");

		expect((await api("DELETE", "/categories", { name: "Pets" })).status).toBe(200);
		expect((await api("DELETE", "/categories", { name: "Pets" })).status).toBe(404);
	});
});

describe("tags", () => {
	test("várias tags por transação, filtro, total e remoção", async () => {
		const [bankTx, bankOther] = await seedBank([
			{ description: "HOTEL", amount: "-300.00", category: "Travel" },
			{ description: "PADARIA", amount: "-10.00", category: "Bakery" },
		]);
		const manualId = (await api("POST", "/transactions/manual", { kind: "expense", date: "2026-12-12", amount: 50, category: "Transporte" })).json.id as string;

		const trip = (await api("POST", "/tags", { name: "Viagem" })).json.id as string;
		const work = (await api("POST", "/tags", { name: "Trabalho" })).json.id as string;
		expect((await api("POST", "/tags", { name: "viagem" })).status).toBe(409);

		const tagged = await api("POST", "/transactions/tag", { ids: [bankTx, manualId, "11111111-1111-4111-8111-111111111111"], tagId: trip });
		expect(tagged.json).toEqual({ tagged: 2, ignored: 1 });
		await api("POST", "/transactions/tag", { ids: [bankTx], tagId: work });
		// Repeating does not duplicate.
		await api("POST", "/transactions/tag", { ids: [bankTx], tagId: trip });
		expect(await db.select().from(transactionTag)).toHaveLength(3);

		const filtered = await list("2026-12", `&tag=${trip}`);
		expect(filtered.map((tx) => tx.id).sort()).toEqual([bankTx!, manualId].sort());
		expect(filtered.find((tx) => tx.id === bankTx)?.tags.map((t) => t.name)).toEqual(["Trabalho", "Viagem"]);
		expect(filtered.every((tx) => tx.id !== bankOther)).toBe(true);
		expect((await api("GET", `/transactions?month=2026-12&tag=nao-e-id`)).status).toBe(400);

		const total = await api("GET", `/tags/${trip}/total?from=2026-12-01&to=2026-12-31`);
		expect(total.json).toMatchObject({ spent: 350, transactions: 2, tag: { name: "Viagem" } });
		expect((await api("GET", `/tags/${trip}/total?from=2026-12-31&to=2026-12-01`)).status).toBe(400);

		expect((await api("GET", "/tags")).json).toEqual([
			{ id: trip, name: "Viagem", transactions: 2 },
			{ id: work, name: "Trabalho", transactions: 1 },
		].sort((a, b) => a.name.localeCompare(b.name)));

		const untagged = await api("POST", "/transactions/untag", { ids: [bankTx, manualId], tagId: trip });
		expect(untagged.json).toEqual({ untagged: 2 });
		expect(await list("2026-12", `&tag=${trip}`)).toHaveLength(0);
		// The tag and the other tag survive.
		expect((await api("GET", "/tags")).json).toHaveLength(2);
	});

	test("apagar a tag solta as transações; apagar a transação solta a tag", async () => {
		const [bankTx] = await seedBank([{ description: "HOTEL", amount: "-300.00", category: "Travel" }]);
		const manualId = (await api("POST", "/transactions/manual", { kind: "expense", date: "2026-12-12", amount: 50, category: "Transporte" })).json.id as string;
		const trip = (await api("POST", "/tags", { name: "Viagem" })).json.id as string;
		await api("POST", "/transactions/tag", { ids: [bankTx, manualId], tagId: trip });

		await api("DELETE", "/expenses", { ids: [manualId] });
		expect(await db.select().from(transactionTag)).toHaveLength(1);

		expect((await api("DELETE", `/tags/${trip}`)).json).toEqual({ deleted: 1 });
		expect(await db.select().from(transactionTag)).toHaveLength(0);
		expect((await list()).find((tx) => tx.id === bankTx)?.tags).toEqual([]);
		expect((await api("DELETE", `/tags/${trip}`)).status).toBe(404);
	});

	test("lote de mais de 100 ids e tag inexistente são recusados", async () => {
		const trip = (await api("POST", "/tags", { name: "Viagem" })).json.id as string;
		const many = Array.from({ length: 101 }, () => "11111111-1111-4111-8111-111111111111");
		expect((await api("POST", "/transactions/tag", { ids: many, tagId: trip })).status).toBe(400);
		expect((await api("POST", "/transactions/tag", { ids: [many[0]], tagId: "22222222-2222-4222-8222-222222222222" })).status).toBe(404);
	});
});
