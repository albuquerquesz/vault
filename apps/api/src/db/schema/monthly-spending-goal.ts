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

export const monthlySpendingGoal = pgTable(
	"monthly_spending_goal",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		month: text("month").notNull(),
		targetAmount: numeric("target_amount", {
			precision: 12,
			scale: 2,
		}).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		index("monthly_spending_goal_user_id_idx").on(table.userId),
		uniqueIndex("monthly_spending_goal_user_month_idx").on(
			table.userId,
			table.month,
		),
	],
);

export const monthlySpendingGoalRelations = relations(
	monthlySpendingGoal,
	({ one }) => ({
		user: one(user, {
			fields: [monthlySpendingGoal.userId],
			references: [user.id],
		}),
	}),
);
