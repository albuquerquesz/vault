CREATE TABLE "bill_payment_override" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"pluggy_bill_id" text NOT NULL,
	"paid_amount" numeric(14, 2),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bill_payment_override" ADD CONSTRAINT "bill_payment_override_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bill_payment_override_user_bill_idx" ON "bill_payment_override" USING btree ("user_id","pluggy_bill_id");