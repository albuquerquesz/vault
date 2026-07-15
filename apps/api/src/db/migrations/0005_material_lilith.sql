CREATE TABLE "pluggy_credentials" (
	"user_id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"client_secret_ciphertext" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "settings" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "pluggy_credentials" ADD CONSTRAINT "pluggy_credentials_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pluggy_items" ADD CONSTRAINT "pluggy_items_user_pluggy_id_unique" UNIQUE("user_id","pluggy_item_id");