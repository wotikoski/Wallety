import { Metadata } from "next";
import { RecurringClient } from "@/components/recurring/RecurringClient";

export const metadata: Metadata = { title: "Recorrências" };

export default function RecurringPage() {
  return <RecurringClient />;
}
