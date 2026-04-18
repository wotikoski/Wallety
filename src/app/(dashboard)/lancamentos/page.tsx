import { Metadata } from "next";
import { TransactionsClient } from "@/components/transactions/TransactionsClient";

export const metadata: Metadata = { title: "Lançamentos" };

export default function LancamentosPage() {
  return <TransactionsClient />;
}
