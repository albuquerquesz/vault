CREATE TABLE "monthly_spending_goal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"month" text NOT NULL,
	"target_amount" numeric(12, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "monthly_spending_goal" ADD CONSTRAINT "monthly_spending_goal_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "monthly_spending_goal_user_id_idx" ON "monthly_spending_goal" USING btree ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "monthly_spending_goal_user_month_idx" ON "monthly_spending_goal" USING btree ("user_id", "month");
