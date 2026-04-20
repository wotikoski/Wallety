import { Metadata } from "next";
import { BudgetsClient } from "@/components/budgets/BudgetsClient";

export const metadata: Metadata = { title: "Orçamentos" };

export default function BudgetsPage() {
  return <BudgetsClient />;
}
