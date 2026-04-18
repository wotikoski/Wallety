-- Wallety Database Schema
-- Run with: drizzle-kit migrate

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

-- REFRESH TOKENS
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at  TIMESTAMPTZ,
  user_agent  TEXT,
  ip_address  TEXT
);

-- GROUPS
CREATE TABLE IF NOT EXISTS groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  owner_id    UUID NOT NULL REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS group_members (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id  UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role      TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS group_invites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  token       TEXT NOT NULL UNIQUE,
  invited_by  UUID NOT NULL REFERENCES users(id),
  accepted_at TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id),
  name       TEXT NOT NULL,
  type       TEXT NOT NULL,
  icon       TEXT,
  color      TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- BANKS
CREATE TABLE IF NOT EXISTS banks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id),
  name       TEXT NOT NULL,
  code       TEXT,
  logo_url   TEXT,
  color      TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- PAYMENT METHODS
CREATE TABLE IF NOT EXISTS payment_methods (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id),
  name       TEXT NOT NULL,
  type       TEXT NOT NULL,
  bank_id    UUID REFERENCES banks(id),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id             UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id              UUID NOT NULL REFERENCES users(id),
  date                 DATE NOT NULL,
  type                 TEXT NOT NULL,
  category_id          UUID REFERENCES categories(id),
  description          TEXT NOT NULL,
  value                NUMERIC(14, 2) NOT NULL,
  payment_method_id    UUID REFERENCES payment_methods(id),
  bank_id              UUID REFERENCES banks(id),
  installment_group_id UUID,
  installment_current  INTEGER,
  installment_total    INTEGER,
  installment_value    NUMERIC(14, 2),
  is_paid              BOOLEAN NOT NULL DEFAULT FALSE,
  paid_at              TIMESTAMPTZ,
  is_fixed             BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence_group_id  UUID,
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at           TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_transactions_group_date   ON transactions(group_id, date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_user_date    ON transactions(user_id, date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_installment  ON transactions(installment_group_id) WHERE installment_group_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_category     ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payment      ON transactions(payment_method_id);

-- MONTHLY BUDGETS
CREATE TABLE IF NOT EXISTS monthly_budgets (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id               UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id                UUID NOT NULL REFERENCES users(id),
  year                   INTEGER NOT NULL,
  month                  INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  planned_income         NUMERIC(14, 2) NOT NULL DEFAULT 0,
  planned_fixed_expenses NUMERIC(14, 2) NOT NULL DEFAULT 0,
  notes                  TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
