CREATE TABLE "monthly_bill" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"month" text NOT NULL,
	"total_bill" numeric(12, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monthly_bill_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"monthly_bill_id" uuid NOT NULL,
	"name" text NOT NULL,
	"paid_amount" numeric(12, 2) NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "savings_target" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"month" text NOT NULL,
	"savings_percentage" numeric(5, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pluggy_items" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "monthly_bill" ADD CONSTRAINT "monthly_bill_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_bill_item" ADD CONSTRAINT "monthly_bill_item_monthly_bill_id_monthly_bill_id_fk" FOREIGN KEY ("monthly_bill_id") REFERENCES "public"."monthly_bill"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_target" ADD CONSTRAINT "savings_target_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "monthly_bill_user_id_idx" ON "monthly_bill" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "monthly_bill_user_month_idx" ON "monthly_bill" USING btree ("user_id","month");--> statement-breakpoint
CREATE INDEX "monthly_bill_item_monthly_bill_id_idx" ON "monthly_bill_item" USING btree ("monthly_bill_id");--> statement-breakpoint
CREATE UNIQUE INDEX "monthly_bill_item_monthly_bill_sort_idx" ON "monthly_bill_item" USING btree ("monthly_bill_id","sort_order");--> statement-breakpoint
CREATE INDEX "savings_target_user_id_idx" ON "savings_target" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "savings_target_user_month_idx" ON "savings_target" USING btree ("user_id","month");