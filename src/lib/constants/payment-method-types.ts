export const PAYMENT_METHOD_TYPES = [
  { value: "bank_account", label: "Conta Corrente" },
  { value: "cash", label: "Dinheiro / À Vista" },
  { value: "pix", label: "Pix" },
  { value: "credit_card", label: "Cartão de Crédito" },
  { value: "debit_card", label: "Cartão de Débito" },
  { value: "other", label: "Outro" },
] as const;

export type PaymentMethodType = (typeof PAYMENT_METHOD_TYPES)[number]["value"];

export const INSTALLMENT_TYPES: PaymentMethodType[] = ["credit_card", "other"];

export function isInstallmentPayment(type: PaymentMethodType): boolean {
  return INSTALLMENT_TYPES.includes(type);
}

export function getPaymentMethodLabel(type: string): string {
  return PAYMENT_METHOD_TYPES.find((t) => t.value === type)?.label ?? type;
}
