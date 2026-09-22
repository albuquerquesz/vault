import { relations } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./user.js";

export const pushSubscription = pgTable("push_subscription", {
	endpointHash: text("endpoint_hash").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	secret: text("secret").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	lastTestAt: timestamp("last_test_at"),
});

export const pushSubscriptionRelations = relations(pushSubscription, ({ one }) => ({
	user: one(user, { fields: [pushSubscription.userId], references: [user.id] }),
}));
