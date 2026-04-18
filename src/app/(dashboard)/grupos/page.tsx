import { Metadata } from "next";
import { GroupsClient } from "@/components/groups/GroupsClient";

export const metadata: Metadata = { title: "Grupos" };

export default function GruposPage() {
  return <GroupsClient />;
}
