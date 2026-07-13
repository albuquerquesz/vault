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
import { pluggyAccounts } from "./pluggy-account.js";

export const pluggyBills = pgTable(
	"pluggy_bills",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		pluggyAccountId: uuid("pluggy_account_id")
			.references(() => pluggyAccounts.id, { onDelete: "cascade" })
			.notNull(),
		pluggyBillId: varchar("pluggy_bill_id", { length: 255 }).notNull(),
		dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
		totalAmount: numeric("total_amount", { precision: 14, scale: 2 }).notNull(),
		paidAmount: numeric("paid_amount", { precision: 14, scale: 2 })
			.default("0")
			.notNull(),
		minimumPaymentAmount: numeric("minimum_payment_amount", {
			precision: 14,
			scale: 2,
		}),
		currency: varchar("currency", { length: 3 }).default("BRL").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	},
	(table) => [
		index("pluggy_bills_account_id_idx").on(table.pluggyAccountId),
		index("pluggy_bills_due_date_idx").on(table.dueDate),
		unique("pluggy_bills_account_bill_unique").on(
			table.pluggyAccountId,
			table.pluggyBillId,
		),
	],
);

export const pluggyBillsRelations = relations(pluggyBills, ({ one }) => ({
	account: one(pluggyAccounts, {
		fields: [pluggyBills.pluggyAccountId],
		references: [pluggyAccounts.id],
	}),
}));
