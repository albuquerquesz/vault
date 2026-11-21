CREATE TABLE "investment_snapshot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"month" varchar(7) NOT NULL,
	"total_balance" numeric(16, 2) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "investment_snapshot_user_month_unique" UNIQUE("user_id","month")
);
--> statement-breakpoint
CREATE TABLE "pluggy_investment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"item_id" uuid NOT NULL,
	"pluggy_investment_id" varchar(255) NOT NULL,
	"name" text NOT NULL,
	"type" varchar(32) NOT NULL,
	"subtype" varchar(64),
	"institution" text,
	"amount_invested" numeric(16, 2),
	"balance" numeric(16, 2) NOT NULL,
	"amount_profit" numeric(16, 2),
	"currency" varchar(3) DEFAULT 'BRL' NOT NULL,
	"status" varchar(32),
	"date" timestamp with time zone,
	"last_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pluggy_investment_item_investment_unique" UNIQUE("item_id","pluggy_investment_id")
);
--> statement-breakpoint
ALTER TABLE "investment_snapshot" ADD CONSTRAINT "investment_snapshot_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pluggy_investment" ADD CONSTRAINT "pluggy_investment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pluggy_investment" ADD CONSTRAINT "pluggy_investment_item_id_pluggy_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."pluggy_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pluggy_investment_user_id_idx" ON "pluggy_investment" USING btree ("user_id");