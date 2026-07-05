import { relations } from "drizzle-orm";
import {
	date,
	index,
	numeric,
	pgTable,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { pluggyItems } from "./pluggy-item";

export const pluggyTransactions = pgTable(
	"pluggy_transactions",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		pluggyItemId: uuid("pluggy_item_id")
			.references(() => pluggyItems.id, { onDelete: "cascade" })
			.notNull(),
		pluggyTransactionId: varchar("pluggy_transaction_id", {
			length: 255,
		}).notNull(),
		date: date("date").notNull(),
		amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
		description: varchar("description", { length: 500 }),
		category: varchar("category", { length: 100 }),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
	},
	(table) => [
		index("pluggy_tx_item_id_idx").on(table.pluggyItemId),
		index("pluggy_tx_pluggy_id_idx").on(table.pluggyTransactionId),
	],
);

export const pluggyTransactionsRelations = relations(
	pluggyTransactions,
	({ one }) => ({
		item: one(pluggyItems, {
			fields: [pluggyTransactions.pluggyItemId],
			references: [pluggyItems.id],
		}),
	}),
);
