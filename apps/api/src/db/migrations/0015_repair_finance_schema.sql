-- Repair schema drift from environments where 0013 was recorded/applied
-- incompletely. Every statement is safe to run against an already repaired DB.
ALTER TABLE "expense" ADD COLUMN IF NOT EXISTS "kind" text;
--> statement-breakpoint
UPDATE "expense" SET "kind" = 'expense' WHERE "kind" IS NULL;
--> statement-breakpoint
ALTER TABLE "expense" ALTER COLUMN "kind" SET DEFAULT 'expense';
--> statement-breakpoint
ALTER TABLE "expense" ALTER COLUMN "kind" SET NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "monthly_spending_goal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"month" text NOT NULL,
	"target_amount" numeric(12, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "monthly_spending_goal_user_id_idx"
	ON "monthly_spending_goal" USING btree ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "monthly_spending_goal_user_month_idx"
	ON "monthly_spending_goal" USING btree ("user_id", "month");
