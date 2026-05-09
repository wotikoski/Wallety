import { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import Link from "next/link";

export const metadata: Metadata = { title: { absolute: "Wallety" } };

export default function LoginPage() {
  return (
    <div>
      <LoginForm />
      <p className="text-center text-[13px] text-slate-500 mt-5">
        Não tem conta?{" "}
        <Link href="/register" className="text-blue-500 no-underline font-medium hover:underline">
          Cadastre-se
        </Link>
      </p>
      <p className="text-center text-[12px] text-slate-500 mt-4">
        <Link href="/termos" className="text-slate-500 hover:text-slate-400 no-underline">
          Termos de Uso
        </Link>
        {" · "}
        <Link href="/privacidade" className="text-slate-500 hover:text-slate-400 no-underline">
          Privacidade
        </Link>
      </p>
    </div>
  );
}
