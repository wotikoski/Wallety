import { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";
import Link from "next/link";

export const metadata: Metadata = { title: "Criar conta" };

export default function RegisterPage() {
  return (
    <div>
      <RegisterForm />
      <p className="text-center text-[13px] text-slate-500 mt-5">
        Já tem conta?{" "}
        <Link href="/login" className="text-blue-500 no-underline font-medium hover:underline">
          Entrar
        </Link>
      </p>
      <p className="text-center text-[12px] text-slate-500 mt-4">
        Ao criar sua conta, você concorda com os{" "}
        <Link href="/termos" className="text-blue-500 no-underline hover:underline">
          Termos de Uso
        </Link>
        {" "}e a{" "}
        <Link href="/privacidade" className="text-blue-500 no-underline hover:underline">
          Política de Privacidade
        </Link>
        .
      </p>
    </div>
  );
}
