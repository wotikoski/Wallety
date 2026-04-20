-- Category budgets: one spending target per (user, category, year, month)
CREATE TABLE IF NOT EXISTS "category_budgets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "group_id" uuid REFERENCES "groups"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "category_id" uuid NOT NULL REFERENCES "categories"("id") ON DELETE CASCADE,
  "year" integer NOT NULL,
  "month" integer NOT NULL,
  "amount" numeric(14, 2) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT NOW(),
  "updated_at" timestamptz NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "uniq_category_budget_user"
  ON "category_budgets" ("user_id", "category_id", "year", "month");

-- Recurring transactions: templates that materialize into `transactions` rows
CREATE TABLE IF NOT EXISTS "recurring_transactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "group_id" uuid REFERENCES "groups"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "type" text NOT NULL,
  "category_id" uuid REFERENCES "categories"("id"),
  "description" text NOT NULL,
  "value" numeric(14, 2) NOT NULL,
  "payment_method_id" uuid REFERENCES "payment_methods"("id"),
  "bank_id" uuid REFERENCES "banks"("id"),
  "notes" text,
  "frequency" text NOT NULL,
  "day_of_month" text,
  "start_date" date NOT NULL,
  "end_date" date,
  "last_generated_date" date,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT NOW(),
  "updated_at" timestamptz NOT NULL DEFAULT NOW(),
  "deleted_at" timestamptz
);

CREATE INDEX IF NOT EXISTS "idx_recurring_user_active"
  ON "recurring_transactions" ("user_id", "is_active");

CREATE INDEX IF NOT EXISTS "idx_recurring_group_active"
  ON "recurring_transactions" ("group_id", "is_active");
