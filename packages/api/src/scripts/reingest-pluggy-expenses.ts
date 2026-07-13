import { db } from "../db";
import { pluggyItems } from "../db/schema";
import { resolvePluggyCredentials } from "../services/connectors/credentials";
import {
	createPluggyService,
	rebuildExpensesFromStoredTransactions,
	syncTransactionsForItem,
} from "../services/pluggy";

async function main() {
	const items = await db.select().from(pluggyItems);

	console.log(`Found ${items.length} Pluggy item(s) to reingest.`);

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
}

await main();
