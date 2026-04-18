import { Metadata } from "next";
import { ReportsClient } from "@/components/reports/ReportsClient";

export const metadata: Metadata = { title: "Relatórios" };

export default function RelatoriosPage() {
  return <ReportsClient />;
}
