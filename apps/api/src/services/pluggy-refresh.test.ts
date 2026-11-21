import { describe, expect, test } from "bun:test";
import {
	isNotUpdatableByApi,
	type RefreshableItem,
	refreshItems,
} from "./pluggy-refresh.js";

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

	test("MeuPluggy items are skipped without asking Pluggy", async () => {
		const asked: string[] = [];

		const summary = await refreshItems(
			[{ ...item("a", "UPDATED"), provider: "MeuPluggy" }, { ...item("b", "UPDATED"), provider: "Nubank" }],
			{
				updateItem: async (i) => {
					asked.push(i.id);
				},
				markRequested: async () => {},
				log: () => {},
			},
		);

		expect(summary).toEqual({ requested: 1, skipped: 1, failed: 0 });
		expect(asked).toEqual(["b"]);
	});

	test("Pluggy refusing an update because the item updates itself counts as skipped", async () => {
		const marked: string[] = [];
		const refused = Object.assign(new Error("MeuPluggy item cant be updated"), {
			details: '{"message":"MeuPluggy item cant be updated"}',
		});

		const summary = await refreshItems([item("a", "UPDATED"), item("b", "UPDATED")], {
			updateItem: async (i) => {
				if (i.id === "a") throw refused;
			},
			markRequested: async (i) => {
				marked.push(i.id);
			},
			log: () => {},
		});

		expect(summary).toEqual({ requested: 1, skipped: 1, failed: 0 });
		expect(marked).toEqual(["b"]);
	});
});

describe("isNotUpdatableByApi", () => {
	test("recognises the message or the error code, and nothing else", () => {
		expect(isNotUpdatableByApi(new Error("MeuPluggy item cant be updated"))).toBe(true);
		expect(
			isNotUpdatableByApi(
				Object.assign(new Error("Bad request"), {
					details: '{"codeDescription":"MEU_PLUGGY_ITEM_UPDATE_NOT_ALLOWED"}',
				}),
			),
		).toBe(true);
		expect(isNotUpdatableByApi(new Error("Rate limited"))).toBe(false);
		expect(isNotUpdatableByApi("MeuPluggy item cant be updated")).toBe(false);
	});
});
