import {
	check,
	index,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { expense } from "./expense.js";
import { pluggyTransactions } from "./pluggy-transaction.js";
import { user } from "./user.js";

/** A free label a transaction can carry next to its single category. */
export const tag = pgTable(
	"tag",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		nameKey: text("name_key").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [uniqueIndex("tag_user_name_key_idx").on(table.userId, table.nameKey)],
);

/**
 * Links a tag to a bank transaction (`pluggy_transactions`) or a manual one
 * (`expense`), exactly one of the two. Real foreign keys, so deleting either
 * side removes the link. Pluggy-derived `expense` rows are rebuilt on every
 * sync and are never tagged; their bank row is.
 */
export const transactionTag = pgTable(
	"transaction_tag",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		tagId: uuid("tag_id")
			.notNull()
			.references(() => tag.id, { onDelete: "cascade" }),
		pluggyTransactionId: uuid("pluggy_transaction_id").references(
			() => pluggyTransactions.id,
			{ onDelete: "cascade" },
		),
		expenseId: uuid("expense_id").references(() => expense.id, {
			onDelete: "cascade",
		}),
	},
	(table) => [
		check(
			"transaction_tag_one_target",
			sql`(${table.pluggyTransactionId} is null) <> (${table.expenseId} is null)`,
		),
		uniqueIndex("transaction_tag_bank_idx").on(table.tagId, table.pluggyTransactionId),
		uniqueIndex("transaction_tag_manual_idx").on(table.tagId, table.expenseId),
		index("transaction_tag_pluggy_idx").on(table.pluggyTransactionId),
		index("transaction_tag_expense_idx").on(table.expenseId),
	],
);
