import { db } from "../db/index.js";
import { pluggyItems } from "../db/schema/index.js";
import { resolvePluggyCredentials } from "../services/connectors/credentials.js";
import {
	createPluggyService,
	materializeMonthlyBillsFromPluggy,
	rebuildExpensesFromStoredTransactions,
	syncTransactionsForItem,
} from "../services/pluggy.js";

async function main() {
	const items = await db.select().from(pluggyItems);

	console.log(`Found ${items.length} Pluggy item(s) to reingest.`);
	const userIds = [...new Set(items.map((item) => item.userId))];

	for (const item of items) {
		console.log(
			`[${item.userId}] Reingesting item ${item.id} (${item.pluggyItemId})...`,
		);

		try {
			const creds = await resolvePluggyCredentials(item.userId);
			const service = createPluggyService(creds);
			const sync = await syncTransactionsForItem({
				service,
				userId: item.userId,
				localItemId: item.id,
				pluggyItemId: item.pluggyItemId,
			});
			const rebuild = await rebuildExpensesFromStoredTransactions({
				userId: item.userId,
				localItemId: item.id,
			});

			console.log(
				JSON.stringify(
					{
						userId: item.userId,
						localItemId: item.id,
						remoteItemId: item.pluggyItemId,
						sync,
						rebuild,
					},
					null,
					2,
				),
			);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Unknown reingest error";
			console.error(
				`[${item.userId}] Failed to reingest item ${item.id}: ${message}`,
			);
		}
	}

	for (const userId of userIds) {
		try {
			await materializeMonthlyBillsFromPluggy({ userId });
			console.log(`[${userId}] Rebuilt monthly bills from pluggy_bills.`);
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Unknown monthly bill materialization error";
			console.error(
				`[${userId}] Failed to rebuild monthly bills from pluggy_bills: ${message}`,
			);
		}
	}
}

await main();
