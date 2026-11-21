import { beforeEach, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../src/db/index.js";
import {
	monthlyBill,
	monthlyBillItem,
	pluggyAccounts,
	pluggyBills,
	pluggyItems,
} from "../src/db/schema/index.js";
import { materializeMonthlyBillsFromPluggy } from "../src/services/pluggy.js";
import { resetDatabase, TEST_USER_ID } from "./helpers.js";

beforeEach(resetDatabase);

async function seed() {
	const [item] = await db
		.insert(pluggyItems)
		.values({ userId: TEST_USER_ID, pluggyItemId: "pi-1", provider: "MeuPluggy" })
		.returning();
	const [account] = await db
		.insert(pluggyAccounts)
		.values({ pluggyItemId: item!.id, pluggyAccountId: "pa-card", type: "CREDIT", name: "gold" })
		.returning();
	const bill = (id: string, due: string, total: string, paid: string) =>
		db.insert(pluggyBills).values({
			pluggyAccountId: account!.id,
			pluggyBillId: id,
			dueDate: new Date(`${due}T00:00:00Z`),
			totalAmount: total,
			paidAmount: paid,
			currency: "BRL",
		});
	await bill("bill-oct", "2026-10-17", "300.00", "0");
	await bill("bill-nov", "2026-11-17", "400.00", "0");
	return { bill };
}

/** The row id of each month's Pluggy item: it changes only when the month is rewritten. */
async function itemIdsByMonth() {
	const rows = await db
		.select({ month: monthlyBill.month, id: monthlyBillItem.id, paid: monthlyBillItem.paidAmount })
		.from(monthlyBillItem)
		.innerJoin(monthlyBill, eq(monthlyBillItem.monthlyBillId, monthlyBill.id));
	return Object.fromEntries(rows.map((row) => [row.month, { id: row.id, paid: Number(row.paid) }]));
}

describe("reconstrução das faturas mensais", () => {
	test("cria um item por mês de fatura", async () => {
		await seed();
		await materializeMonthlyBillsFromPluggy({ userId: TEST_USER_ID });

		const items = await itemIdsByMonth();
		expect(Object.keys(items).sort()).toEqual(["2026-10", "2026-11"]);
	});

	test("sem nada novo, nenhum mês é reescrito", async () => {
		await seed();
		await materializeMonthlyBillsFromPluggy({ userId: TEST_USER_ID });
		const before = await itemIdsByMonth();

		await materializeMonthlyBillsFromPluggy({ userId: TEST_USER_ID });

		expect(await itemIdsByMonth()).toEqual(before);
	});

	test("só o mês que mudou é reescrito e o outro fica como estava", async () => {
		await seed();
		await materializeMonthlyBillsFromPluggy({ userId: TEST_USER_ID });
		const before = await itemIdsByMonth();

		await db.update(pluggyBills).set({ paidAmount: "150.00" }).where(eq(pluggyBills.pluggyBillId, "bill-nov"));
		await materializeMonthlyBillsFromPluggy({ userId: TEST_USER_ID });

		const after = await itemIdsByMonth();
		expect(after["2026-10"]).toEqual(before["2026-10"]);
		expect(after["2026-11"]?.id).not.toBe(before["2026-11"]?.id);
		expect(after["2026-11"]?.paid).toBe(150);
	});

	test("uma fatura nova cria o mês dela sem mexer nos outros", async () => {
		const { bill } = await seed();
		await materializeMonthlyBillsFromPluggy({ userId: TEST_USER_ID });
		const before = await itemIdsByMonth();

		await bill("bill-dec", "2026-12-17", "500.00", "0");
		await materializeMonthlyBillsFromPluggy({ userId: TEST_USER_ID });

		const after = await itemIdsByMonth();
		expect(Object.keys(after).sort()).toEqual(["2026-10", "2026-11", "2026-12"]);
		expect(after["2026-10"]).toEqual(before["2026-10"]);
		expect(after["2026-11"]).toEqual(before["2026-11"]);
	});

	test("um mês que ficou sem fatura é limpo", async () => {
		await seed();
		await materializeMonthlyBillsFromPluggy({ userId: TEST_USER_ID });

		await db.delete(pluggyBills).where(eq(pluggyBills.pluggyBillId, "bill-oct"));
		await materializeMonthlyBillsFromPluggy({ userId: TEST_USER_ID });

		const items = await itemIdsByMonth();
		expect(Object.keys(items)).toEqual(["2026-11"]);
	});
});
