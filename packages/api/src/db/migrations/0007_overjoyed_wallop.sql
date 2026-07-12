CREATE TABLE "pluggy_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pluggy_item_id" uuid NOT NULL,
	"pluggy_account_id" varchar(255) NOT NULL,
	"type" varchar(20) NOT NULL,
	"subtype" varchar(50),
	"name" varchar(200),
	"balance" numeric(14, 2),
	"available_balance" numeric(14, 2),
	"currency" varchar(3) DEFAULT 'BRL',
	"transfer_number" varchar(100),
	"brand" varchar(50),
	"status" varchar(50),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "pluggy_transactions" ADD COLUMN "pluggy_account_id" uuid;--> statement-breakpoint
ALTER TABLE "pluggy_accounts" ADD CONSTRAINT "pluggy_accounts_pluggy_item_id_pluggy_items_id_fk" FOREIGN KEY ("pluggy_item_id") REFERENCES "public"."pluggy_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pluggy_accounts_item_id_idx" ON "pluggy_accounts" USING btree ("pluggy_item_id");--> statement-breakpoint
CREATE INDEX "pluggy_accounts_pluggy_id_idx" ON "pluggy_accounts" USING btree ("pluggy_account_id");--> statement-breakpoint
ALTER TABLE "pluggy_accounts" ADD CONSTRAINT "pluggy_accounts_item_account_unique" UNIQUE("pluggy_item_id","pluggy_account_id");--> statement-breakpoint
ALTER TABLE "pluggy_transactions" ADD CONSTRAINT "pluggy_transactions_pluggy_account_id_pluggy_accounts_id_fk" FOREIGN KEY ("pluggy_account_id") REFERENCES "public"."pluggy_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pluggy_tx_account_id_idx" ON "pluggy_transactions" USING btree ("pluggy_account_id");--> statement-breakpoint
ALTER TABLE "pluggy_transactions" ADD CONSTRAINT "pluggy_transactions_item_transaction_unique" UNIQUE("pluggy_item_id","pluggy_transaction_id");
