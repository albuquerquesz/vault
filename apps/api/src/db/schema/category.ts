import {
	boolean,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { user } from "./user.js";

/**
 * A category the user created, renamed or archived on purpose. Categories that
 * only exist because a transaction uses the name are not stored here; the
 * catalog the user sees is this table plus the names in use.
 */
export const category = pgTable(
	"category",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		/** Name as the user wrote it. */
		name: text("name").notNull(),
		/** Lowercase, accent-free, single-spaced; what makes two spellings the same. */
		nameKey: text("name_key").notNull(),
		archived: boolean("archived").default(false).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		uniqueIndex("category_user_name_key_idx").on(table.userId, table.nameKey),
	],
);
