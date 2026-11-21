ALTER TABLE "pluggy_bills" ADD COLUMN "bill_closing_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pluggy_accounts" ADD COLUMN "credit_limit" numeric(14, 2);--> statement-breakpoint
ALTER TABLE "pluggy_accounts" ADD COLUMN "available_credit_limit" numeric(14, 2);--> statement-breakpoint
ALTER TABLE "pluggy_accounts" ADD COLUMN "balance_close_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pluggy_accounts" ADD COLUMN "balance_due_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pluggy_accounts" ADD COLUMN "minimum_payment" numeric(14, 2);