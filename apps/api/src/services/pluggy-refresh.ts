import { eq } from "drizzle-orm";
import type { PluggyCredentials } from "../clients/pluggy/types.js";
import { db } from "../db/index.js";
import { pluggyItems } from "../db/schema/index.js";
import { resolvePluggyCredentials } from "./connectors/credentials.js";
import { createPluggyService } from "./pluggy.js";

/**
 * Pluggy does not refresh most items on its own (the app's plan has no update
 * frequency), so the Vault asks for it once a day. Pluggy collects the item and
 * calls the webhook with `item/updated`, which runs the sync.
 *
 * MeuPluggy items are the exception: Pluggy refuses an update by API
 * (MEU_PLUGGY_ITEM_UPDATE_NOT_ALLOWED) and refreshes them itself a couple of
 * times a day, calling the same webhook. They are skipped, not failed.
 */

/** Connector whose items update themselves and reject an update request. */
const SELF_UPDATING_PROVIDERS = new Set(["meupluggy"]);

const NOT_UPDATABLE_CODE = "MEU_PLUGGY_ITEM_UPDATE_NOT_ALLOWED";
const NOT_UPDATABLE_MESSAGE = "meupluggy item cant be updated";

/** Pluggy's answer when an item updates itself and cannot be asked to refresh. */
export function isNotUpdatableByApi(error: unknown): boolean {
	if (!(error instanceof Error)) return false;
	const details = (error as { details?: unknown }).details;
	return (
		error.message.toLowerCase().includes(NOT_UPDATABLE_MESSAGE) ||
		(typeof details === "string" && details.includes(NOT_UPDATABLE_CODE))
	);
}

/** States where asking for an update would fail or collide with a running one. */
const SKIPPED_STATUSES = new Set([
	"UPDATING",
	"WAITING_USER_INPUT",
	"WAITING_USER_ACTION",
]);

export type RefreshableItem = {
	id: string;
	userId: string;
	pluggyItemId: string;
	status: string;
	/** Connector name, e.g. "MeuPluggy". */
	provider?: string;
};

export type RefreshDeps = {
	updateItem: (item: RefreshableItem) => Promise<void>;
	markRequested: (item: RefreshableItem) => Promise<void>;
	log?: (message: string, detail: Record<string, unknown>) => void;
};

export type RefreshSummary = {
	requested: number;
	skipped: number;
	failed: number;
};

/** One failing item never stops the others. */
export async function refreshItems(
	items: RefreshableItem[],
	deps: RefreshDeps,
): Promise<RefreshSummary> {
	const log = deps.log ?? ((message, detail) => console.info(message, detail));
	const summary: RefreshSummary = { requested: 0, skipped: 0, failed: 0 };

	for (const item of items) {
		if (
			SKIPPED_STATUSES.has(item.status.toUpperCase()) ||
			SELF_UPDATING_PROVIDERS.has((item.provider ?? "").toLowerCase())
		) {
			summary.skipped += 1;
			continue;
		}
		try {
			await deps.updateItem(item);
			await deps.markRequested(item);
			summary.requested += 1;
		} catch (error) {
			if (isNotUpdatableByApi(error)) {
				// Not a failure: this item refreshes itself.
				summary.skipped += 1;
				continue;
			}
			summary.failed += 1;
			log("[pluggy-refresh] item refresh failed", {
				localItemId: item.id,
				pluggyItemId: item.pluggyItemId,
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	log("[pluggy-refresh] done", { items: items.length, ...summary });
	return summary;
}

export async function requestPluggyItemRefreshes(): Promise<RefreshSummary> {
	const items = await db
		.select({
			id: pluggyItems.id,
			userId: pluggyItems.userId,
			pluggyItemId: pluggyItems.pluggyItemId,
			status: pluggyItems.status,
			provider: pluggyItems.provider,
		})
		.from(pluggyItems);

	const credentialsByUser = new Map<string, Promise<PluggyCredentials>>();
	const credentialsFor = (userId: string) => {
		let creds = credentialsByUser.get(userId);
		if (!creds) {
			creds = resolvePluggyCredentials(userId);
			credentialsByUser.set(userId, creds);
		}
		return creds;
	};

	return refreshItems(items, {
		updateItem: async (item) => {
			const service = createPluggyService(await credentialsFor(item.userId));
			await service.updateItem(item.pluggyItemId);
		},
		markRequested: async (item) => {
			await db
				.update(pluggyItems)
				.set({ refreshRequestedAt: new Date() })
				.where(eq(pluggyItems.id, item.id));
		},
	});
}
