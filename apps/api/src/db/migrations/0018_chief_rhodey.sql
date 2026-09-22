ALTER TABLE "pluggy_items" ADD COLUMN "refresh_requested_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pluggy_items" ADD COLUMN "last_pluggy_updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pluggy_items" ADD COLUMN "last_webhook_received_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pluggy_items" ADD COLUMN "last_sync_completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pluggy_items" ADD COLUMN "last_sync_status" varchar(32);--> statement-breakpoint
ALTER TABLE "pluggy_items" ADD COLUMN "last_sync_error" text;