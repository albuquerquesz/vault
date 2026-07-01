import { relations } from "drizzle-orm";
import {
	date,
	index,
	numeric,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { user } from "./user";

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
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		index("expense_user_id_idx").on(table.userId),
		index("expense_date_idx").on(table.expenseDate),
	],
);

export const expenseRelations = relations(expense, ({ one }) => ({
	user: one(user, {
		fields: [expense.userId],
		references: [user.id],
	}),
}));
