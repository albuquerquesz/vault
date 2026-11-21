import {
	numeric,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { user } from "./user.js";

/** A spending ceiling for one category in one month (`AAAA-MM`). */
export const monthlyCategoryLimit = pgTable(
	"monthly_category_limit",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		month: text("month").notNull(),
		/** Name as the user typed it. */
		category: text("category").notNull(),
		/** Lowercase, accent-free name; what makes two spellings the same category. */
		categoryKey: text("category_key").notNull(),
		targetAmount: numeric("target_amount", { precision: 12, scale: 2 }).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		uniqueIndex("monthly_category_limit_user_month_category_idx").on(
			table.userId,
			table.month,
			table.categoryKey,
		),
	],
);
