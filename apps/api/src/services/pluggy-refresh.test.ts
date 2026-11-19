import { describe, expect, test } from "bun:test";
import { type RefreshableItem, refreshItems } from "./pluggy-refresh.js";

const item = (id: string, status: string): RefreshableItem => ({
	id,
	userId: "user-1",
	pluggyItemId: `pluggy-${id}`,
	status,
});

describe("refreshItems", () => {
	test("asks for an update and records the request", async () => {
		const updated: string[] = [];
		const marked: string[] = [];

		const summary = await refreshItems([item("a", "UPDATED")], {
			updateItem: async (i) => {
				updated.push(i.pluggyItemId);
			},
			markRequested: async (i) => {
				marked.push(i.id);
			},
			log: () => {},
		});

		expect(summary).toEqual({ requested: 1, skipped: 0, failed: 0 });
		expect(updated).toEqual(["pluggy-a"]);
		expect(marked).toEqual(["a"]);
	});

	test("skips items that are updating or waiting for the user", async () => {
		const updated: string[] = [];

		const summary = await refreshItems(
			[
				item("a", "UPDATING"),
				item("b", "WAITING_USER_ACTION"),
				item("c", "waiting_user_input"),
				item("d", "OUTDATED"),
			],
			{
				updateItem: async (i) => {
					updated.push(i.id);
				},
				markRequested: async () => {},
				log: () => {},
			},
		);

		expect(summary).toEqual({ requested: 1, skipped: 3, failed: 0 });
		expect(updated).toEqual(["d"]);
	});

	test("one failing item does not stop the others nor get recorded", async () => {
		const marked: string[] = [];

		const summary = await refreshItems(
			[item("a", "UPDATED"), item("b", "UPDATED"), item("c", "UPDATED")],
			{
				updateItem: async (i) => {
					if (i.id === "b") throw new Error("Pluggy said no");
				},
				markRequested: async (i) => {
					marked.push(i.id);
				},
				log: () => {},
			},
		);

		expect(summary).toEqual({ requested: 2, skipped: 0, failed: 1 });
		expect(marked).toEqual(["a", "c"]);
	});
});
