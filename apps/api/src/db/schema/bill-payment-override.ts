import {
	numeric,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { user } from "./user.js";

/**
 * A payment the user recorded by hand for a card bill. The Pluggy sync rewrites
 * `pluggy_bills`, so a manual payment lives in its own table and is never
 * overwritten.
 */
export const billPaymentOverride = pgTable(
	"bill_payment_override",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		pluggyBillId: text("pluggy_bill_id").notNull(),
		/** Null means the whole bill was paid. */
		paidAmount: numeric("paid_amount", { precision: 14, scale: 2 }),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		uniqueIndex("bill_payment_override_user_bill_idx").on(
			table.userId,
			table.pluggyBillId,
		),
	],
);
