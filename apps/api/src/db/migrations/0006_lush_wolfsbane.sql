ALTER TABLE "pluggy_transactions"
ADD CONSTRAINT "pluggy_transactions_item_transaction_unique"
UNIQUE("pluggy_item_id","pluggy_transaction_id");
