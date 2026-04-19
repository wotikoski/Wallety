import { Metadata } from "next";
import { GroupDetailClient } from "@/components/groups/GroupDetailClient";

export const metadata: Metadata = { title: "Detalhes do Grupo" };

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GroupDetailClient id={id} />;
}
