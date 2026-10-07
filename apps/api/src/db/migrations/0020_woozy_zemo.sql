ALTER TABLE "goal" ADD COLUMN "is_completed" boolean DEFAULT false NOT NULL;
UPDATE "goal"
SET "is_completed" = true
WHERE "current_amount" >= "target_amount";
