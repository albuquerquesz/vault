import { relations } from "drizzle-orm";
import {
	index,
	numeric,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { user } from "./user";

export const monthlyBill = pgTable(
	"monthly_bill",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		month: text("month").notNull(),
		totalBill: numeric("total_bill", { precision: 12, scale: 2 }).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		index("monthly_bill_user_id_idx").on(table.userId),
		uniqueIndex("monthly_bill_user_month_idx").on(table.userId, table.month),
	],
);

export const monthlyBillRelations = relations(monthlyBill, ({ one }) => ({
	user: one(user, {
		fields: [monthlyBill.userId],
		references: [user.id],
	}),
}));
