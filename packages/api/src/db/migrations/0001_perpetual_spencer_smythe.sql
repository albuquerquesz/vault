CREATE TABLE "pluggy_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"pluggy_item_id" varchar(255) NOT NULL,
	"provider" varchar(100) NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pluggy_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pluggy_item_id" uuid NOT NULL,
	"pluggy_transaction_id" varchar(255) NOT NULL,
	"date" date NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"description" varchar(500),
	"category" varchar(100),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "pluggy_items" ADD CONSTRAINT "pluggy_items_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pluggy_transactions" ADD CONSTRAINT "pluggy_transactions_pluggy_item_id_pluggy_items_id_fk" FOREIGN KEY ("pluggy_item_id") REFERENCES "public"."pluggy_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pluggy_items_user_id_idx" ON "pluggy_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "pluggy_items_pluggy_id_idx" ON "pluggy_items" USING btree ("pluggy_item_id");--> statement-breakpoint
CREATE INDEX "pluggy_tx_item_id_idx" ON "pluggy_transactions" USING btree ("pluggy_item_id");--> statement-breakpoint
CREATE INDEX "pluggy_tx_pluggy_id_idx" ON "pluggy_transactions" USING btree ("pluggy_transaction_id");