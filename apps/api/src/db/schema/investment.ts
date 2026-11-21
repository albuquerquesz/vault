import {
	index,
	numeric,
	pgTable,
	text,
	timestamp,
	unique,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { pluggyItems } from "./pluggy-item.js";
import { user } from "./user.js";

/** Current position of one investment, as last reported by Pluggy (INVESTMENTS product). */
export const pluggyInvestments = pgTable(
	"pluggy_investment",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: text("user_id")
			.references(() => user.id, { onDelete: "cascade" })
			.notNull(),
		itemId: uuid("item_id")
			.references(() => pluggyItems.id, { onDelete: "cascade" })
			.notNull(),
		pluggyInvestmentId: varchar("pluggy_investment_id", {
			length: 255,
		}).notNull(),
		name: text("name").notNull(),
		/** COE, EQUITY, ETF, FIXED_INCOME, MUTUAL_FUND, SECURITY or OTHER. */
		type: varchar("type", { length: 32 }).notNull(),
		subtype: varchar("subtype", { length: 64 }),
		institution: text("institution"),
		/** `amountOriginal`; null when the provider does not report it. */
		amountInvested: numeric("amount_invested", { precision: 16, scale: 2 }),
		/** Net balance now. */
		balance: numeric("balance", { precision: 16, scale: 2 }).notNull(),
		/** `amountProfit`, when the connector sends it. */
		amountProfit: numeric("amount_profit", { precision: 16, scale: 2 }),
		currency: varchar("currency", { length: 3 }).default("BRL").notNull(),
		/** ACTIVE, PENDING or TOTAL_WITHDRAWAL. */
		status: varchar("status", { length: 32 }),
		/** Reference date of the position, from Pluggy. */
		date: timestamp("date", { withTimezone: true }),
		lastUpdatedAt: timestamp("last_updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("pluggy_investment_user_id_idx").on(table.userId),
		unique("pluggy_investment_item_investment_unique").on(
			table.itemId,
			table.pluggyInvestmentId,
		),
	],
);

/** One total per user and month, written at the end of a sync (no backfill). */
export const investmentSnapshots = pgTable(
	"investment_snapshot",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: text("user_id")
			.references(() => user.id, { onDelete: "cascade" })
			.notNull(),
		/** AAAA-MM */
		month: varchar("month", { length: 7 }).notNull(),
		totalBalance: numeric("total_balance", { precision: 16, scale: 2 }).notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		unique("investment_snapshot_user_month_unique").on(
			table.userId,
			table.month,
		),
	],
);
