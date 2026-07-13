import { relations } from "drizzle-orm";
import {
	date,
	index,
	numeric,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { pluggyItems } from "./pluggy-item.js";
import { user } from "./user.js";

export const expense = pgTable(
	"expense",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		expenseDate: date("expense_date", { mode: "string" }).notNull(),
		amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
		category: text("category").notNull(),
		note: text("note"),
		source: text("source").default("manual").notNull(),
		sourceExternalId: text("source_external_id"),
		sourceItemId: uuid("source_item_id").references(() => pluggyItems.id, {
			onDelete: "cascade",
		}),
		sourceProvider: text("source_provider"),
		sourceAccountName: text("source_account_name"),
		sourceAccountType: text("source_account_type"),
		sourceAccountSubtype: text("source_account_subtype"),
		sourceAccountBrand: text("source_account_brand"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		index("expense_user_id_idx").on(table.userId),
		index("expense_date_idx").on(table.expenseDate),
		index("expense_source_item_id_idx").on(table.sourceItemId),
		uniqueIndex("expense_user_source_external_idx").on(
			table.userId,
			table.source,
			table.sourceExternalId,
		),
	],
);

export const expenseRelations = relations(expense, ({ one }) => ({
	user: one(user, {
		fields: [expense.userId],
		references: [user.id],
	}),
	item: one(pluggyItems, {
		fields: [expense.sourceItemId],
		references: [pluggyItems.id],
	}),
}));
