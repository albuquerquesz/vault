import { relations } from "drizzle-orm";
import {
	date,
	index,
	numeric,
	pgTable,
	timestamp,
	unique,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { pluggyAccounts } from "./pluggy-account.js";
import { pluggyItems } from "./pluggy-item.js";

export const pluggyTransactions = pgTable(
	"pluggy_transactions",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		pluggyItemId: uuid("pluggy_item_id")
			.references(() => pluggyItems.id, { onDelete: "cascade" })
			.notNull(),
		pluggyAccountId: uuid("pluggy_account_id").references(
			() => pluggyAccounts.id,
			{ onDelete: "cascade" },
		),
		pluggyTransactionId: varchar("pluggy_transaction_id", {
			length: 255,
		}).notNull(),
		date: date("date").notNull(),
		amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
		description: varchar("description", { length: 500 }),
		category: varchar("category", { length: 100 }),
		/** User/agent-chosen category; display only, never used to classify. */
		categoryOverride: varchar("category_override", { length: 100 }),
		/** Pluggy bill id (credit cards), set once the transaction is billed. */
		pluggyBillId: varchar("pluggy_bill_id", { length: 255 }),
		hiddenAt: timestamp("hidden_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
	},
	(table) => [
		index("pluggy_tx_item_id_idx").on(table.pluggyItemId),
		index("pluggy_tx_account_id_idx").on(table.pluggyAccountId),
		index("pluggy_tx_pluggy_id_idx").on(table.pluggyTransactionId),
		index("pluggy_tx_bill_id_idx").on(table.pluggyBillId),
		unique("pluggy_transactions_item_transaction_unique").on(
			table.pluggyItemId,
			table.pluggyTransactionId,
		),
	],
);

export const pluggyTransactionsRelations = relations(
	pluggyTransactions,
	({ one }) => ({
		item: one(pluggyItems, {
			fields: [pluggyTransactions.pluggyItemId],
			references: [pluggyItems.id],
		}),
		account: one(pluggyAccounts, {
			fields: [pluggyTransactions.pluggyAccountId],
			references: [pluggyAccounts.id],
		}),
	}),
);
