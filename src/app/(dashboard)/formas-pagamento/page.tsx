import { Metadata } from "next";
import { PaymentMethodsClient } from "@/components/crud/PaymentMethodsClient";

export const metadata: Metadata = { title: "Formas de Pagamento" };

export default function FormasPagamentoPage() {
  return <PaymentMethodsClient />;
}
