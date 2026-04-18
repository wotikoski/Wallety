import { Metadata } from "next";
import { BanksClient } from "@/components/crud/BanksClient";

export const metadata: Metadata = { title: "Bancos" };

export default function BancosPage() {
  return <BanksClient />;
}
