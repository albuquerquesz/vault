CREATE TABLE "category_alert_sent" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"month" text NOT NULL,
	"category_key" text NOT NULL,
	"threshold" integer NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "push_subscription" ADD COLUMN "last_pace_alert_date" text;--> statement-breakpoint
ALTER TABLE "category_alert_sent" ADD CONSTRAINT "category_alert_sent_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "category_alert_sent_user_month_category_threshold_idx" ON "category_alert_sent" USING btree ("user_id","month","category_key","threshold");