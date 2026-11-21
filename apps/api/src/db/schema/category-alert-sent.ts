import {
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { user } from "./user.js";

/**
 * A category limit alert already sent: one row per user, category, month
 * (`AAAA-MM`) and threshold (80 or 100). The unique index is what keeps a sync
 * that fires twice from notifying twice.
 */
export const categoryAlertSent = pgTable(
	"category_alert_sent",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		month: text("month").notNull(),
		/** Lowercase, accent-free name (same key as `monthly_category_limit`). */
		categoryKey: text("category_key").notNull(),
		threshold: integer("threshold").notNull(),
		sentAt: timestamp("sent_at").defaultNow().notNull(),
	},
	(table) => [
		uniqueIndex("category_alert_sent_user_month_category_threshold_idx").on(
			table.userId,
			table.month,
			table.categoryKey,
			table.threshold,
		),
	],
);
