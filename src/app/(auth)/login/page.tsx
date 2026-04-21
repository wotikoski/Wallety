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
      <p style={{ textAlign: "center", fontSize: "12px", color: "#64748b", marginTop: "16px" }}>
        <Link href="/termos" style={{ color: "#64748b", textDecoration: "none" }}>
          Termos de Uso
        </Link>
        {" · "}
        <Link href="/privacidade" style={{ color: "#64748b", textDecoration: "none" }}>
          Privacidade
        </Link>
      </p>
      <p style={{ textAlign: "center", fontSize: "11px", color: "#475569", marginTop: "24px" }}>
        Feito por <span style={{ color: "#94a3b8" }}>Leonardo Schneider</span>
      </p>
      <p style={{ textAlign: "center", fontSize: "11px", marginTop: "4px" }}>
        <a href="mailto:leonardoschneider@outlook.pt" style={{ color: "#475569", textDecoration: "none" }}>E-mail</a>
        <span style={{ color: "#334155", margin: "0 6px" }}>·</span>
        <a href="https://t.me/leonardoschneider" target="_blank" rel="noopener noreferrer" style={{ color: "#475569", textDecoration: "none" }}>Telegram</a>
        <span style={{ color: "#334155", margin: "0 6px" }}>·</span>
        <a href="https://www.linkedin.com/in/wotikoski/" target="_blank" rel="noopener noreferrer" style={{ color: "#475569", textDecoration: "none" }}>LinkedIn</a>
      </p>
    </div>
  );
}
