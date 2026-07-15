ALTER TABLE "expense"
ADD COLUMN "source" text DEFAULT 'manual' NOT NULL;
--> statement-breakpoint
ALTER TABLE "expense"
ADD COLUMN "source_external_id" text;
--> statement-breakpoint
ALTER TABLE "expense"
ADD COLUMN "source_item_id" uuid;
--> statement-breakpoint
ALTER TABLE "expense"
ADD CONSTRAINT "expense_source_item_id_pluggy_items_id_fk"
FOREIGN KEY ("source_item_id") REFERENCES "public"."pluggy_items"("id")
ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "expense_source_item_id_idx" ON "expense" USING btree ("source_item_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "expense_user_source_external_idx"
ON "expense" USING btree ("user_id","source","source_external_id");
