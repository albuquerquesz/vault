import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { PluggyApiError } from "../clients/pluggy/index.js";
import { db } from "../db/index.js";
import { pluggyItems, pluggyTransactions } from "../db/schema/index.js";
import {
	MissingPluggyCredentialsError,
	resolvePluggyCredentials,
} from "./connectors/credentials.js";
import {
	createPluggyService,
	deleteDerivedExpensesForItem,
	syncTransactionsForItem,
} from "./pluggy.js";

export {
	ensurePluggyWebhookRegistered,
	getPluggyWebhookRegistrationHeaders,
	getPluggyWebhookUrl,
	isPluggyWebhookSecretValid,
} from "./pluggy-webhook-config.js";

const SYNC_EVENTS = new Set([
	"item/created",
	"item/updated",
	"transactions/created",
	"transactions/updated",
	"transactions/deleted",
]);

const STATUS_EVENTS = new Set([
	"item/error",
	"item/waiting_user_input",
	"item/waiting_user_action",
	"item/login_succeeded",
]);

const pluggyWebhookSchema = z
	.object({
		event: z.string().min(1),
		eventId: z.string().optional(),
		itemId: z.string().optional(),
		clientUserId: z.string().optional(),
		triggeredBy: z.string().optional(),
		accountId: z.string().optional(),
		transactionIds: z.array(z.string()).optional(),
		createdTransactionsLink: z.string().optional(),
		error: z
			.object({
				code: z.string().optional(),
				message: z.string().optional(),
			})
			.passthrough()
			.optional(),
	})
	.passthrough();

export type PluggyWebhookPayload = z.infer<typeof pluggyWebhookSchema>;

export type PluggyWebhookHandleResult = {
	received: true;
	event: string;
	eventId?: string;
	handled:
		| "synced"
		| "status_updated"
		| "deleted"
		| "unknown_item"
		| "ignored"
		| "partial_failure";
	results: Array<{
		localItemId: string;
		userId: string;
		status: "success" | "failed" | "deleted" | "ignored";
		error?: string;
		synced?: number;
		total?: number;
	}>;
};

export function parsePluggyWebhookBody(body: unknown): PluggyWebhookPayload {
	return pluggyWebhookSchema.parse(body);
}

export async function resolveLocalItemsForWebhook(params: {
	itemId: string;
	clientUserId?: string;
}) {
	const { itemId, clientUserId } = params;

	if (clientUserId) {
		return db
			.select({
				id: pluggyItems.id,
				userId: pluggyItems.userId,
				pluggyItemId: pluggyItems.pluggyItemId,
				status: pluggyItems.status,
			})
			.from(pluggyItems)
			.where(
				and(
					eq(pluggyItems.pluggyItemId, itemId),
					eq(pluggyItems.userId, clientUserId),
				),
			);
	}

	return db
		.select({
			id: pluggyItems.id,
			userId: pluggyItems.userId,
			pluggyItemId: pluggyItems.pluggyItemId,
			status: pluggyItems.status,
		})
		.from(pluggyItems)
		.where(eq(pluggyItems.pluggyItemId, itemId));
}

async function updateLocalItemStatus(params: {
	localItemId: string;
	status: string;
}) {
	await db
		.update(pluggyItems)
		.set({
			status: params.status,
			updatedAt: new Date(),
		})
		.where(eq(pluggyItems.id, params.localItemId));
}

async function deleteLocalItemFully(localItemId: string) {
	await deleteDerivedExpensesForItem(localItemId);
	await db
		.delete(pluggyTransactions)
		.where(eq(pluggyTransactions.pluggyItemId, localItemId));
	await db.delete(pluggyItems).where(eq(pluggyItems.id, localItemId));
}

async function syncOneLocalItem(params: {
	userId: string;
	localItemId: string;
	pluggyItemId: string;
	updateStatus: boolean;
}): Promise<PluggyWebhookHandleResult["results"][number]> {
	const { userId, localItemId, pluggyItemId, updateStatus } = params;

	try {
		const creds = await resolvePluggyCredentials(userId);
		const service = createPluggyService(creds);

		if (updateStatus) {
			try {
				const remote = await service.getItem(pluggyItemId);
				await updateLocalItemStatus({
					localItemId,
					status: remote.status,
				});
			} catch (error) {
				if (!(error instanceof PluggyApiError && error.statusCode === 404)) {
					// Non-fatal: still attempt product sync.
					console.warn("[pluggy-webhook] failed to refresh item status", {
						localItemId,
						error,
					});
				}
			}
		}

		const sync = await syncTransactionsForItem({
			service,
			userId,
			localItemId,
			pluggyItemId,
		});

		return {
			localItemId,
			userId,
			status: sync.status === "success" ? "success" : "failed",
			synced: sync.synced,
			total: sync.total,
			error: sync.error,
		};
	} catch (error) {
		const message =
			error instanceof MissingPluggyCredentialsError
				? error.message
				: error instanceof PluggyApiError
					? error.message
					: error instanceof Error
						? error.message
						: "Unknown webhook sync error";

		return {
			localItemId,
			userId,
			status: "failed",
			error: message,
		};
	}
}

async function refreshStatusOneLocalItem(params: {
	userId: string;
	localItemId: string;
	pluggyItemId: string;
	fallbackStatus?: string;
}): Promise<PluggyWebhookHandleResult["results"][number]> {
	const { userId, localItemId, pluggyItemId, fallbackStatus } = params;

	try {
		const creds = await resolvePluggyCredentials(userId);
		const service = createPluggyService(creds);
		const remote = await service.getItem(pluggyItemId);
		await updateLocalItemStatus({
			localItemId,
			status: remote.status,
		});
		return {
			localItemId,
			userId,
			status: "success",
		};
	} catch (error) {
		if (fallbackStatus) {
			await updateLocalItemStatus({
				localItemId,
				status: fallbackStatus,
			});
			return {
				localItemId,
				userId,
				status: "success",
			};
		}

		const message =
			error instanceof Error ? error.message : "Failed to refresh item status";
		return {
			localItemId,
			userId,
			status: "failed",
			error: message,
		};
	}
}

/**
 * Handle a Pluggy data webhook. Idempotent: safe to re-run on retries.
 */
export async function handlePluggyWebhookEvent(
	payload: PluggyWebhookPayload,
): Promise<PluggyWebhookHandleResult> {
	const event = payload.event;
	const base = {
		received: true as const,
		event,
		eventId: payload.eventId,
	};

	// Events without item context (connector health, payments, etc.)
	if (!payload.itemId) {
		return {
			...base,
			handled: "ignored",
			results: [],
		};
	}

	const localItems = await resolveLocalItemsForWebhook({
		itemId: payload.itemId,
		clientUserId: payload.clientUserId,
	});

	if (localItems.length === 0) {
		return {
			...base,
			handled: "unknown_item",
			results: [],
		};
	}

	if (event === "item/deleted") {
		const results: PluggyWebhookHandleResult["results"] = [];
		for (const item of localItems) {
			try {
				await deleteLocalItemFully(item.id);
				results.push({
					localItemId: item.id,
					userId: item.userId,
					status: "deleted",
				});
			} catch (error) {
				results.push({
					localItemId: item.id,
					userId: item.userId,
					status: "failed",
					error:
						error instanceof Error
							? error.message
							: "Failed to delete local item",
				});
			}
		}

		const failed = results.some((r) => r.status === "failed");
		return {
			...base,
			handled: failed ? "partial_failure" : "deleted",
			results,
		};
	}

	if (SYNC_EVENTS.has(event)) {
		const results: PluggyWebhookHandleResult["results"] = [];
		for (const item of localItems) {
			results.push(
				await syncOneLocalItem({
					userId: item.userId,
					localItemId: item.id,
					pluggyItemId: item.pluggyItemId,
					updateStatus: event.startsWith("item/"),
				}),
			);
		}

		const anySuccess = results.some((r) => r.status === "success");
		const anyFailed = results.some((r) => r.status === "failed");
		return {
			...base,
			handled:
				anyFailed && anySuccess
					? "partial_failure"
					: anyFailed
						? "partial_failure"
						: "synced",
			results,
		};
	}

	if (STATUS_EVENTS.has(event)) {
		const fallbackStatus =
			event === "item/error"
				? "LOGIN_ERROR"
				: event === "item/waiting_user_input"
					? "WAITING_USER_INPUT"
					: event === "item/waiting_user_action"
						? "WAITING_USER_ACTION"
						: undefined;

		const results: PluggyWebhookHandleResult["results"] = [];
		for (const item of localItems) {
			results.push(
				await refreshStatusOneLocalItem({
					userId: item.userId,
					localItemId: item.id,
					pluggyItemId: item.pluggyItemId,
					fallbackStatus,
				}),
			);
		}

		const failed = results.some((r) => r.status === "failed");
		return {
			...base,
			handled: failed ? "partial_failure" : "status_updated",
			results,
		};
	}

	return {
		...base,
		handled: "ignored",
		results: localItems.map((item) => ({
			localItemId: item.id,
			userId: item.userId,
			status: "ignored" as const,
		})),
	};
}
