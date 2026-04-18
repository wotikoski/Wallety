import { Metadata } from "next";
import { DailyLimitClient } from "@/components/daily-limit/DailyLimitClient";

export const metadata: Metadata = { title: "Limite Diário" };

export default function LimiteDiarioPage() {
  return <DailyLimitClient />;
}
