import { beforeEach, describe, expect, test } from "bun:test";
import dayjs from "dayjs";
import { eq } from "drizzle-orm";
import { app } from "../src/hono/app.js";
import { db } from "../src/db/index.js";
import {
	categoryAlertSent,
	pushSubscription,
	user,
} from "../src/db/schema/index.js";
import { encryptSecret } from "../src/lib/secret-crypto.js";
import { sendPaceAlertForUser } from "../src/services/pace-alert-dispatch.js";
import { api, resetDatabase, TEST_USER_ID } from "./helpers.js";

beforeEach(resetDatabase);

// 15:00 in Brasília (UTC-3), outside the quiet hours.
const DAY10 = dayjs("2026-03-10T18:00:00Z");
const DAY10_NIGHT = dayjs("2026-03-10T01:30:00Z"); // 22:30 of the 9th in Brasília
const DAY11 = dayjs("2026-03-11T18:00:00Z");

const sub = {
	endpoint: "https://fcm.googleapis.com/fcm/send/pace-test",
	keys: { auth: "12345678abc", p256dh: "A".repeat(65) },
};

function fakeSender() {
	const calls: { subscription: unknown; payload: { title: string; body: string; url: string } }[] = [];
	let fail: unknown = null;
	return {
		calls,
		failWith: (error: unknown) => {
			fail = error;
		},
		send: async (subscription: unknown, payload: string) => {
			if (fail) throw fail;
			calls.push({ subscription, payload: JSON.parse(payload) });
		},
	};
}

async function enable(on = true) {
	await db
		.update(user)
		.set({ settings: { paceAlertsEnabled: on } })
		.where(eq(user.id, TEST_USER_ID));
}

async function subscribe(hash = "hash-1") {
	await db.insert(pushSubscription).values({
		endpointHash: hash,
		userId: TEST_USER_ID,
		secret: encryptSecret(JSON.stringify({ ...sub, endpoint: `${sub.endpoint}-${hash}` })),
	});
}

const spend = (date: string, amount: number, category = "Mercado") =>
	api("POST", "/transactions/manual", { kind: "expense", date, amount, category });
const goal = (targetAmount: number) =>
	api("POST", "/spending-goal", { month: "2026-03", targetAmount });
const limit = (category: string, targetAmount: number) =>
	api("POST", "/category-limits", { month: "2026-03", category, targetAmount });

const run = (sender: ReturnType<typeof fakeSender>, now = DAY10) =>
	sendPaceAlertForUser({ userId: TEST_USER_ID, now, send: sender.send });

describe("alerta de ritmo de gasto", () => {
	test("projeção acima do teto envia um push com o texto e a URL do teto", async () => {
		await enable();
		await subscribe();
		await goal(1000);
		await spend("2026-03-10", 600); // R$ 600 no dia 10 de 31 dias: projeta R$ 1.860
		const sender = fakeSender();

		const result = await run(sender);
		expect(result).toMatchObject({ sent: 1, failed: 0 });
		expect(sender.calls).toHaveLength(1);
		expect(sender.calls[0]!.payload.url).toBe("/spending-goal");
		expect(sender.calls[0]!.payload.body.replace(/\s/g, " ")).toContain(
			"R$ 1.860,00 no mês, R$ 860,00 acima do teto de R$ 1.000,00",
		);
	});

	test("dois disparos no mesmo dia mandam um alerta só; no dia seguinte volta", async () => {
		await enable();
		await subscribe();
		await goal(1000);
		await spend("2026-03-10", 600);
		const sender = fakeSender();

		await run(sender);
		const again = await run(sender);
		expect(again).toMatchObject({ sent: 0, skipped: "already_sent_today" });
		expect(sender.calls).toHaveLength(1);

		await run(sender, DAY11);
		expect(sender.calls).toHaveLength(2);
	});

	test("disparos concorrentes não duplicam", async () => {
		await enable();
		await subscribe();
		await goal(1000);
		await spend("2026-03-10", 600);
		const sender = fakeSender();

		await Promise.all([run(sender), run(sender), run(sender)]);
		expect(sender.calls).toHaveLength(1);
	});

	test("antes do 5º dia, abaixo do teto, sem teto e desligado não enviam", async () => {
		await subscribe();
		const sender = fakeSender();

		// sem teto nem limite
		await enable();
		expect(await run(sender)).toMatchObject({ skipped: "nothing_due" });

		await goal(1000);
		await spend("2026-03-03", 600);
		// 4º dia: cedo demais
		expect(await run(sender, dayjs("2026-03-04T18:00:00Z"))).toMatchObject({ skipped: "nothing_due" });
		// dia 10 com R$ 600: já projeta acima, mas com teto folgado não
		await goal(5000);
		expect(await run(sender)).toMatchObject({ skipped: "nothing_due" });

		// desligado
		await goal(1000);
		await enable(false);
		expect(await run(sender)).toMatchObject({ skipped: "disabled" });
		expect(sender.calls).toHaveLength(0);
	});

	test("horário silencioso (22h às 8h de Brasília) não envia nem consome o dia", async () => {
		await enable();
		await subscribe();
		await goal(1000);
		await spend("2026-03-09", 600);
		const sender = fakeSender();

		expect(await run(sender, DAY10_NIGHT)).toMatchObject({ skipped: "quiet_hours" });
		expect(sender.calls).toHaveLength(0);
		// Saindo do silêncio, o alerta ainda é devido.
		expect((await run(sender, DAY10)).sent).toBe(1);
	});

	test("usuário sem inscrição de push não dá erro e nada é enviado", async () => {
		await enable();
		await goal(1000);
		await spend("2026-03-10", 600);
		const sender = fakeSender();
		expect(await run(sender)).toMatchObject({ sent: 0, skipped: "no_subscription" });
	});

	test("categoria: 80% avisa uma vez, 100% avisa de novo, nada repete no mês", async () => {
		await enable();
		await subscribe();
		await limit("Mercado", 1000);
		const sender = fakeSender();

		await spend("2026-03-05", 700);
		expect(await run(sender)).toMatchObject({ skipped: "nothing_due" }); // 70%

		await spend("2026-03-06", 150); // 85%
		await run(sender);
		expect(sender.calls).toHaveLength(1);
		expect(sender.calls[0]!.payload.body).toContain("Mercado chegou a 80% do limite do mês.");

		// Mesmo dia: o teto diário de um alerta segura o próximo para amanhã.
		await spend("2026-03-10", 200); // 105%
		expect((await run(sender)).skipped).toBe("already_sent_today");
		await run(sender, DAY11);
		expect(sender.calls).toHaveLength(2);
		expect(sender.calls[1]!.payload.body).toContain("Mercado passou do limite do mês.");

		// Nada mais para esse mês.
		await spend("2026-03-12", 500);
		expect(await run(sender, dayjs("2026-03-12T18:00:00Z"))).toMatchObject({ skipped: "nothing_due" });
		const rows = await db.select().from(categoryAlertSent);
		expect(rows.map((r) => r.threshold).sort((a, b) => a - b)).toEqual([80, 100]);
	});

	test("ritmo e categoria no mesmo dia vão em um push só", async () => {
		await enable();
		await subscribe();
		await goal(1000);
		await limit("Lazer", 100);
		await spend("2026-03-10", 900, "Lazer");
		const sender = fakeSender();

		await run(sender);
		expect(sender.calls).toHaveLength(1);
		const { body } = sender.calls[0]!.payload;
		expect(body).toContain("acima do teto");
		expect(body).toContain("Lazer passou do limite do mês.");
	});

	test("falha temporária no envio não gasta o dia nem o limiar; endpoint expirado remove a inscrição", async () => {
		await enable();
		await subscribe();
		await limit("Mercado", 100);
		await spend("2026-03-10", 90);
		const sender = fakeSender();

		sender.failWith(new Error("boom"));
		expect(await run(sender)).toMatchObject({ sent: 0, failed: 1 });
		expect(await db.select().from(categoryAlertSent)).toHaveLength(0);

		sender.failWith(null);
		expect((await run(sender)).sent).toBe(1);

		sender.failWith({ statusCode: 410 });
		await run(sender, DAY11); // nada devido, não toca no envio
		await spend("2026-03-11", 20); // 110%
		await run(sender, DAY11);
		expect(await db.select().from(pushSubscription)).toHaveLength(0);
	});
});

describe("PUT /api/settings/push/pace-alerts", () => {
	const settings = (method: string, body?: unknown) =>
		app.fetch(
			new Request("http://localhost:3000/api/settings/push/pace-alerts", {
				method,
				headers: { "content-type": "application/json", "x-vault-dev-auth-bypass": "1" },
				body: body === undefined ? undefined : JSON.stringify(body),
			}),
		);

	test("vem desligado, liga e desliga sem mexer no resumo diário", async () => {
		await db.update(user).set({ settings: { dailySummaryEnabled: true } }).where(eq(user.id, TEST_USER_ID));
		expect((await (await settings("GET")).json()) as unknown).toEqual({ enabled: false });

		expect((await settings("PUT", { enabled: true })).status).toBe(200);
		expect((await (await settings("GET")).json()) as unknown).toEqual({ enabled: true });
		const [row] = await db.select({ settings: user.settings }).from(user).where(eq(user.id, TEST_USER_ID));
		expect(row!.settings).toMatchObject({ dailySummaryEnabled: true, paceAlertsEnabled: true });

		expect((await settings("PUT", { enabled: "sim" })).status).toBeGreaterThanOrEqual(400);
	});
});
