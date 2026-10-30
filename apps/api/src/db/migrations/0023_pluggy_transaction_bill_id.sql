ALTER TABLE "pluggy_transactions" ADD COLUMN "pluggy_bill_id" varchar(255);--> statement-breakpoint
CREATE INDEX "pluggy_tx_bill_id_idx" ON "pluggy_transactions" USING btree ("pluggy_bill_id");