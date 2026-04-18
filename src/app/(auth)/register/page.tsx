import { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";
import Link from "next/link";

export const metadata: Metadata = { title: "Criar conta" };

export default function RegisterPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">Crie sua conta</h1>
      <p className="text-slate-500 text-sm mb-6">Comece a organizar suas finanças hoje</p>
      <RegisterForm />
      <p className="text-center text-sm text-slate-500 mt-6">
        Já tem conta?{" "}
        <Link href="/login" className="text-brand-600 font-medium hover:text-brand-700">
          Entrar
        </Link>
      </p>
    </div>
  );
}
