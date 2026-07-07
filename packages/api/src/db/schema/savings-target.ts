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

export const savingsTarget = pgTable(
	"savings_target",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		month: text("month").notNull(),
		savingsPercentage: numeric("savings_percentage", {
			precision: 5,
			scale: 2,
		}).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		index("savings_target_user_id_idx").on(table.userId),
		uniqueIndex("savings_target_user_month_idx").on(table.userId, table.month),
	],
);

export const savingsTargetRelations = relations(savingsTarget, ({ one }) => ({
	user: one(user, {
		fields: [savingsTarget.userId],
		references: [user.id],
	}),
}));
