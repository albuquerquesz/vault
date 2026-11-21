CREATE TABLE "tag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"name_key" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction_tag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tag_id" uuid NOT NULL,
	"pluggy_transaction_id" uuid,
	"expense_id" uuid,
	CONSTRAINT "transaction_tag_one_target" CHECK (("transaction_tag"."pluggy_transaction_id" is null) <> ("transaction_tag"."expense_id" is null))
);
--> statement-breakpoint
CREATE TABLE "category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"name_key" text NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category_rule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"match_type" text NOT NULL,
	"pattern" text NOT NULL,
	"category" text NOT NULL,
	"priority" integer NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tag" ADD CONSTRAINT "tag_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_tag" ADD CONSTRAINT "transaction_tag_tag_id_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_tag" ADD CONSTRAINT "transaction_tag_pluggy_transaction_id_pluggy_transactions_id_fk" FOREIGN KEY ("pluggy_transaction_id") REFERENCES "public"."pluggy_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_tag" ADD CONSTRAINT "transaction_tag_expense_id_expense_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expense"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_rule" ADD CONSTRAINT "category_rule_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tag_user_name_key_idx" ON "tag" USING btree ("user_id","name_key");--> statement-breakpoint
CREATE UNIQUE INDEX "transaction_tag_bank_idx" ON "transaction_tag" USING btree ("tag_id","pluggy_transaction_id");--> statement-breakpoint
CREATE UNIQUE INDEX "transaction_tag_manual_idx" ON "transaction_tag" USING btree ("tag_id","expense_id");--> statement-breakpoint
CREATE INDEX "transaction_tag_pluggy_idx" ON "transaction_tag" USING btree ("pluggy_transaction_id");--> statement-breakpoint
CREATE INDEX "transaction_tag_expense_idx" ON "transaction_tag" USING btree ("expense_id");--> statement-breakpoint
CREATE UNIQUE INDEX "category_user_name_key_idx" ON "category" USING btree ("user_id","name_key");--> statement-breakpoint
CREATE INDEX "category_rule_user_id_idx" ON "category_rule" USING btree ("user_id");