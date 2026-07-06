import { relations } from "drizzle-orm";
import {
	index,
	numeric,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { user } from "./user";

export const goal = pgTable(
	"goal",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		targetAmount: numeric("target_amount", {
			precision: 12,
			scale: 2,
		}).notNull(),
		currentAmount: numeric("current_amount", { precision: 12, scale: 2 })
			.default("0")
			.notNull(),
		currency: text("currency").default("BRL").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("goal_user_id_idx").on(table.userId)],
);

export const goalRelations = relations(goal, ({ one }) => ({
	user: one(user, {
		fields: [goal.userId],
		references: [user.id],
	}),
}));
