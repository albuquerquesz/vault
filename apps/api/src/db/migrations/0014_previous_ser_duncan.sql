UPDATE "expense" SET "source" = 'cash' WHERE "source" = 'manual';
--> statement-breakpoint
ALTER TABLE "expense" ALTER COLUMN "source" SET DEFAULT 'cash';
