import { relations } from "drizzle-orm";
import {
	index,
	integer,
	numeric,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { monthlyBill } from "./monthly-bill.js";

export const monthlyBillItem = pgTable(
	"monthly_bill_item",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		monthlyBillId: uuid("monthly_bill_id")
			.notNull()
			.references(() => monthlyBill.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		paidAmount: numeric("paid_amount", { precision: 12, scale: 2 }).notNull(),
		totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
		sortOrder: integer("sort_order").notNull(),
		/** Origin of the row: manual seed/UI vs Pluggy credit-card bill sync. */
		source: text("source").default("manual").notNull(),
		pluggyBillId: text("pluggy_bill_id"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		index("monthly_bill_item_monthly_bill_id_idx").on(table.monthlyBillId),
		uniqueIndex("monthly_bill_item_monthly_bill_sort_idx").on(
			table.monthlyBillId,
			table.sortOrder,
		),
	],
);

export const monthlyBillItemRelations = relations(
	monthlyBillItem,
	({ one }) => ({
		monthlyBill: one(monthlyBill, {
			fields: [monthlyBillItem.monthlyBillId],
			references: [monthlyBill.id],
		}),
	}),
);
