import { Metadata } from "next";
import { CalendarClient } from "@/components/calendar/CalendarClient";

export const metadata: Metadata = { title: "Calendário" };

export default function CalendarioPage() {
  return <CalendarClient />;
}
