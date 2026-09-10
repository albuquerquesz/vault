import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./user.js";

export const mcpAccessToken = pgTable(
	"mcp_access_token",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		tokenHash: text("token_hash").notNull().unique(),
		tokenPrefix: text("token_prefix").notNull(),
		lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		revokedAt: timestamp("revoked_at", { withTimezone: true }),
	},
	(table) => [index("mcp_access_token_user_id_idx").on(table.userId)],
);

export const mcpAccessTokenRelations = relations(mcpAccessToken, ({ one }) => ({
	user: one(user, {
		fields: [mcpAccessToken.userId],
		references: [user.id],
	}),
}));
