import { Metadata } from "next";
import { CategoriesClient } from "@/components/crud/CategoriesClient";

export const metadata: Metadata = { title: "Categorias" };

export default function CategoriasPage() {
  return <CategoriesClient />;
}
