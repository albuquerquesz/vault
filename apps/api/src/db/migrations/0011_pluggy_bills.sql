CREATE TABLE "pluggy_bills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pluggy_account_id" uuid NOT NULL,
	"pluggy_bill_id" varchar(255) NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"total_amount" numeric(14, 2) NOT NULL,
	"paid_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"minimum_payment_amount" numeric(14, 2),
	"currency" varchar(3) DEFAULT 'BRL' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "pluggy_bills" ADD CONSTRAINT "pluggy_bills_pluggy_account_id_pluggy_accounts_id_fk" FOREIGN KEY ("pluggy_account_id") REFERENCES "public"."pluggy_accounts"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "pluggy_bills_account_id_idx" ON "pluggy_bills" USING btree ("pluggy_account_id");
--> statement-breakpoint
CREATE INDEX "pluggy_bills_due_date_idx" ON "pluggy_bills" USING btree ("due_date");
--> statement-breakpoint
CREATE UNIQUE INDEX "pluggy_bills_account_bill_unique" ON "pluggy_bills" USING btree ("pluggy_account_id","pluggy_bill_id");
--> statement-breakpoint
ALTER TABLE "monthly_bill_item" ADD COLUMN "source" text DEFAULT 'manual' NOT NULL;
--> statement-breakpoint
ALTER TABLE "monthly_bill_item" ADD COLUMN "pluggy_bill_id" text;
