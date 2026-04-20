import { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import Link from "next/link";

export const metadata: Metadata = { title: { absolute: "Wallety" } };

export default function LoginPage() {
  return (
    <div>
      <LoginForm />
      <p style={{ textAlign: "center", fontSize: "13px", color: "#475569", marginTop: "20px" }}>
        Não tem conta?{" "}
        <Link href="/register" style={{ color: "#3b82f6", textDecoration: "none", fontWeight: 500 }}>
          Cadastre-se
        </Link>
      </p>
    </div>
  );
}
