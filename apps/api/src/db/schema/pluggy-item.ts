import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid, varchar, unique } from "drizzle-orm/pg-core";
import { user } from "./user.js";

export const pluggyItems = pgTable(
	"pluggy_items",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: text("user_id")
			.references(() => user.id, { onDelete: "cascade" })
			.notNull(),
		pluggyItemId: varchar("pluggy_item_id", { length: 255 }).notNull(),
		provider: varchar("provider", { length: 100 }).notNull(),
		status: varchar("status", { length: 50 }).notNull().default("active"),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	},
	(table) => [
		index("pluggy_items_user_id_idx").on(table.userId),
		index("pluggy_items_pluggy_id_idx").on(table.pluggyItemId),
		unique("pluggy_items_user_pluggy_id_unique").on(table.userId, table.pluggyItemId),
	],
);

export const pluggyItemsRelations = relations(pluggyItems, ({ one }) => ({
	user: one(user, {
		fields: [pluggyItems.userId],
		references: [user.id],
	}),
}));
