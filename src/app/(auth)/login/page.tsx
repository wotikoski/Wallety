import { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import Link from "next/link";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">Bem-vindo de volta</h1>
      <p className="text-slate-500 text-sm mb-6">Entre com sua conta para continuar</p>
      <LoginForm />
      <p className="text-center text-sm text-slate-500 mt-6">
        Não tem conta?{" "}
        <Link href="/register" className="text-brand-600 font-medium hover:text-brand-700">
          Cadastre-se
        </Link>
      </p>
    </div>
  );
}
