import { relations } from "drizzle-orm";
import { boolean, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { account } from "./account.js";
import { expense } from "./expense.js";
import { mcpAccessToken } from "./mcp-access-token.js";
import { monthlyBudget } from "./monthly-budget.js";
import { monthlySpendingGoal } from "./monthly-spending-goal.js";
import { session } from "./session.js";

export type UserSettings = {
	theme?: "light" | "dark" | null;
	/** Monthly income in integer cents (e.g. R$ 4.500,00 → 450000). */
	monthlyIncome?: number | null;
	incomeDay?: number | null;
};

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text("image"),
	settings: jsonb("settings").$type<UserSettings>().default({}).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
});

export const userRelations = relations(user, ({ many }) => ({
	accounts: many(account),
	sessions: many(session),
	expenses: many(expense),
	budgets: many(monthlyBudget),
	monthlySpendingGoals: many(monthlySpendingGoal),
	mcpAccessTokens: many(mcpAccessToken),
}));
