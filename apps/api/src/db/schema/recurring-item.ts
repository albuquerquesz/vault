import {
	index,
	integer,
	numeric,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { user } from "./user.js";

/**
 * A fixed bill or a recurring income the user registered by hand, for money the
 * bank does not report ahead of time (rent paid by boleto, a salary in an
 * unconnected account). It is valid from `start_month` to `end_month`.
 */
export const recurringItem = pgTable(
	"recurring_item",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		/** `bill` (money out) or `income` (money in). */
		kind: text("kind").notNull(),
		name: text("name").notNull(),
		amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
		/** 1 to 31; in a shorter month it falls on the last day. */
		dayOfMonth: integer("day_of_month").notNull(),
		/** `AAAA-MM`. */
		startMonth: text("start_month").notNull(),
		/** `AAAA-MM`, inclusive; null means it never ends. */
		endMonth: text("end_month"),
		category: text("category").notNull(),
		/** Text that identifies the real transaction; defaults to the name. */
		matchText: text("match_text"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("recurring_item_user_id_idx").on(table.userId)],
);

/** A month of a recurring item the user marked as paid (or received) by hand. */
export const recurringPayment = pgTable(
	"recurring_payment",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		itemId: uuid("item_id")
			.notNull()
			.references(() => recurringItem.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		month: text("month").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		uniqueIndex("recurring_payment_item_month_idx").on(
			table.itemId,
			table.month,
		),
	],
);
