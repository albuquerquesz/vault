import { relations } from "drizzle-orm";
import { boolean, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { account } from "./account.js";
import { expense } from "./expense.js";
import { monthlyBudget } from "./monthly-budget.js";
import { session } from "./session.js";

export type UserSettings = {
	theme?: "light" | "dark" | null;
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

export const userRelations = relations(
	user,
	({ many }) => ({
		accounts: many(account),
		sessions: many(session),
		expenses: many(expense),
		budgets: many(monthlyBudget),
	}),
);