-- Credit-card invoice support.
-- payment_methods gains closing_day / due_day (nullable, only meaningful when
-- type = 'credit_card'). transactions gains effective_date (the invoice due
-- date for credit-card purchases) so dashboards and budgets can aggregate
-- by cash-flow month instead of purchase date.

ALTER TABLE payment_methods
  ADD COLUMN IF NOT EXISTS closing_day integer,
  ADD COLUMN IF NOT EXISTS due_day integer;

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS effective_date date;

CREATE INDEX IF NOT EXISTS idx_transactions_effective_date
  ON transactions (COALESCE(effective_date, date));
