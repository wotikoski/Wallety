import { Metadata } from "next";
import { ProfileClient } from "@/components/ProfileClient";

export const metadata: Metadata = { title: "Meu Perfil" };

export default function PerfilPage() {
  return <ProfileClient />;
}
