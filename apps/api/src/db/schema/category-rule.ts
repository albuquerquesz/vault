import {
	boolean,
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { user } from "./user.js";

/**
 * "Description contains X -> category Y". Changes only the category name shown
 * for bank transactions; it never changes what counts as spending or income.
 */
export const categoryRule = pgTable(
	"category_rule",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		/** `contains`, `starts_with` or `equals`. */
		matchType: text("match_type").notNull(),
		/** As the user typed it; compared without case, accents or extra spaces. */
		pattern: text("pattern").notNull(),
		category: text("category").notNull(),
		/** Lower number wins when two rules match. */
		priority: integer("priority").notNull(),
		enabled: boolean("enabled").default(true).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("category_rule_user_id_idx").on(table.userId)],
);
