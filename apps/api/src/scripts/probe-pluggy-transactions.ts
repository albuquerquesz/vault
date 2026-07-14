/**
 * One-off probe: fetch raw Pluggy transaction payloads (credit + bank)
 * and try the Recurring Payments enrichment endpoint.
 *
 * Usage: bun run src/scripts/probe-pluggy-transactions.ts
 */
import "dotenv/config";
import pg from "pg";
import { authenticatePluggy } from "../clients/pluggy/index.js";
import { resolvePluggyCredentials } from "../services/connectors/credentials.js";

async function main() {
	const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
	await c.connect();
	const userId = (
		await c.query("SELECT user_id FROM pluggy_credentials LIMIT 1")
	).rows[0]?.user_id as string | undefined;
	if (!userId) {
		throw new Error("No pluggy_credentials row");
	}

	const items = (
		await c.query(
			"SELECT pluggy_item_id FROM pluggy_items WHERE status = $1",
			["UPDATED"],
		)
	).rows as Array<{ pluggy_item_id: string }>;

	const accs = (
		await c.query(
			`SELECT a.pluggy_account_id, a.type, a.name
       FROM pluggy_accounts a
       JOIN pluggy_items i ON a.pluggy_item_id = i.id
       WHERE i.status = $1`,
			["UPDATED"],
		)
	).rows as Array<{
		pluggy_account_id: string;
		type: string;
		name: string | null;
	}>;
	await c.end();

	const creds = await resolvePluggyCredentials(userId);
	const { apiKey } = await authenticatePluggy(creds);
	console.log("auth ok, apiKey length", apiKey.length);

	const dateFrom = "2026-01-01";
	const dateTo = "2026-07-13";

	for (const a of accs) {
		const params = new URLSearchParams({
			accountId: a.pluggy_account_id,
			dateFrom,
			dateTo,
		});
		const res = await fetch(
			`https://api.pluggy.ai/v2/transactions?${params}`,
			{ headers: { "X-API-KEY": apiKey } },
		);
		const text = await res.text();
		if (!res.ok) {
			console.log(
				"FAIL",
				a.type,
				a.name,
				res.status,
				text.slice(0, 300),
			);
			continue;
		}

		const data = JSON.parse(text) as {
			results?: Array<Record<string, unknown>>;
		};
		const results = data.results ?? [];
		console.log("\n===", a.type, a.name, "n=", results.length);
		if (results[0]) {
			console.log("keys", Object.keys(results[0]));
		}

		let withCc = 0;
		let withPay = 0;
		let withMerch = 0;
		let withInst = 0;
		for (const t of results) {
			const cc = t.creditCardMetadata as Record<string, unknown> | null;
			if (cc) {
				withCc++;
				if (cc.totalInstallments || cc.installmentNumber) withInst++;
			}
			if (t.paymentData) withPay++;
			if (t.merchant) withMerch++;
		}
		console.log({ withCc, withPay, withMerch, withInst });

		const rich = results.filter(
			(t) => t.creditCardMetadata || t.paymentData || t.merchant,
		);
		const pick = (rich.length ? rich : results).slice(0, 4).map((t) => ({
			id: t.id,
			date: t.date,
			description: t.description,
			descriptionRaw: t.descriptionRaw,
			amount: t.amount,
			type: t.type,
			status: t.status,
			category: t.category,
			operationType: t.operationType,
			creditCardMetadata: t.creditCardMetadata ?? null,
			paymentData: t.paymentData ?? null,
			merchant: t.merchant ?? null,
		}));
		console.log(JSON.stringify(pick, null, 2));
	}

	for (const item of items) {
		const endpoints = [
			"https://enrichment-api.pluggy.ai/recurring-payments",
			"https://api.pluggy.ai/recurring-payments",
		];
		for (const base of endpoints) {
			const res = await fetch(base, {
				method: "POST",
				headers: {
					"X-API-KEY": apiKey,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ itemId: item.pluggy_item_id }),
			});
			const text = await res.text();
			console.log(
				"\n=== recurring",
				base,
				item.pluggy_item_id.slice(0, 8),
				res.status,
				text.slice(0, 1500),
			);
		}
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
