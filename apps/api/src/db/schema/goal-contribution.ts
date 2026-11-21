import {
	date,
	index,
	numeric,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { goal } from "./goal.js";
import { user } from "./user.js";

/** A deposit into, or a withdrawal from, a goal. Moves `goal.current_amount`. */
export const goalContribution = pgTable(
	"goal_contribution",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		goalId: uuid("goal_id")
			.notNull()
			.references(() => goal.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
		/** `deposit` or `withdrawal`. */
		kind: text("kind").default("deposit").notNull(),
		date: date("date", { mode: "string" }).notNull(),
		note: text("note"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [index("goal_contribution_goal_id_idx").on(table.goalId)],
);
