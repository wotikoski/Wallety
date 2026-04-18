import { Metadata } from "next";
import { GroupDetailClient } from "@/components/groups/GroupDetailClient";

export const metadata: Metadata = { title: "Detalhes do Grupo" };

export default function GroupDetailPage({ params }: { params: { id: string } }) {
  return <GroupDetailClient id={params.id} />;
}
