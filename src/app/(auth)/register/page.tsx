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
      <p style={{ textAlign: "center", fontSize: "12px", color: "#64748b", marginTop: "16px" }}>
        Ao criar sua conta, você concorda com os{" "}
        <Link href="/termos" style={{ color: "#3b82f6", textDecoration: "none" }}>
          Termos de Uso
        </Link>
        {" "}e a{" "}
        <Link href="/privacidade" style={{ color: "#3b82f6", textDecoration: "none" }}>
          Política de Privacidade
        </Link>
        .
      </p>
    </div>
  );
}
