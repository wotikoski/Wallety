import { Metadata } from "next";
import { GoalsClient } from "@/components/goals/GoalsClient";

export const metadata: Metadata = { title: "Metas de Poupança" };

export default function MetasPage() {
  return <GoalsClient />;
}
