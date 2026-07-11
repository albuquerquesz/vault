import { relations } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./user";

export const pluggyCredentials = pgTable("pluggy_credentials", {
	userId: text("user_id")
		.primaryKey()
		.references(() => user.id, { onDelete: "cascade" }),
	clientId: text("client_id").notNull(),
	/** AES-256-GCM ciphertext (base64: iv.tag.ciphertext). */
	clientSecretCiphertext: text("client_secret_ciphertext").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

export const pluggyCredentialsRelations = relations(
	pluggyCredentials,
	({ one }) => ({
		user: one(user, {
			fields: [pluggyCredentials.userId],
			references: [user.id],
		}),
	}),
);
