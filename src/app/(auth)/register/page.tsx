import { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";
import Link from "next/link";

export const metadata: Metadata = { title: "Criar conta" };

export default function RegisterPage() {
  return (
    <div>
      <RegisterForm />
      <p style={{ textAlign: "center", fontSize: "13px", color: "#475569", marginTop: "20px" }}>
        Já tem conta?{" "}
        <Link href="/login" style={{ color: "#3b82f6", textDecoration: "none", fontWeight: 500 }}>
          Entrar
        </Link>
      </p>
    </div>
  );
}
