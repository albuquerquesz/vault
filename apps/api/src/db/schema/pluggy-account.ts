import { relations } from "drizzle-orm";
import {
	index,
	numeric,
	pgTable,
	timestamp,
	unique,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { pluggyItems } from "./pluggy-item.js";

export const pluggyAccounts = pgTable(
	"pluggy_accounts",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		pluggyItemId: uuid("pluggy_item_id")
			.references(() => pluggyItems.id, { onDelete: "cascade" })
			.notNull(),
		pluggyAccountId: varchar("pluggy_account_id", {
			length: 255,
		}).notNull(),
		type: varchar("type", { length: 20 }).notNull(), // BANK | CREDIT
		subtype: varchar("subtype", { length: 50 }), // checkings, savings, credit_card
		name: varchar("name", { length: 200 }),
		balance: numeric("balance", { precision: 14, scale: 2 }),
		availableBalance: numeric("available_balance", { precision: 14, scale: 2 }),
		currency: varchar("currency", { length: 3 }).default("BRL"),
		transferNumber: varchar("transfer_number", { length: 100 }),
		brand: varchar("brand", { length: 50 }),
		status: varchar("status", { length: 50 }),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	},
	(table) => [
		index("pluggy_accounts_item_id_idx").on(table.pluggyItemId),
		index("pluggy_accounts_pluggy_id_idx").on(table.pluggyAccountId),
		unique("pluggy_accounts_item_account_unique").on(
			table.pluggyItemId,
			table.pluggyAccountId,
		),
	],
);

export const pluggyAccountsRelations = relations(
	pluggyAccounts,
	({ one }) => ({
		item: one(pluggyItems, {
			fields: [pluggyAccounts.pluggyItemId],
			references: [pluggyItems.id],
		}),
	}),
);
