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
import { user } from "./user.js";

export const monthlyBudget = pgTable(
	"monthly_budget",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		month: text("month").notNull(),
		income: numeric("income", { precision: 12, scale: 2 }).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		index("monthly_budget_user_id_idx").on(table.userId),
		uniqueIndex("monthly_budget_user_month_idx").on(table.userId, table.month),
	],
);

export const monthlyBudgetRelations = relations(monthlyBudget, ({ one }) => ({
	user: one(user, {
		fields: [monthlyBudget.userId],
		references: [user.id],
	}),
}));
