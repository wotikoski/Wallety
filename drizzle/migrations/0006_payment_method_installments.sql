-- Add supports_installments flag to payment_methods.
-- Defaults to false for all existing rows. When true, Novo Lançamento will
-- automatically expand the Parcelamento section when this payment method
-- is selected.

ALTER TABLE payment_methods
  ADD COLUMN IF NOT EXISTS supports_installments boolean NOT NULL DEFAULT false;
