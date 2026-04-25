"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterInput } from "@/lib/validations/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "10px",
  padding: "11px 14px",
  fontSize: "15px",
  color: "#e2e8f0",
  outline: "none",
  marginBottom: "16px",
  transition: "border-color 0.2s, box-shadow 0.2s",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "13px",
  fontWeight: 500,
  color: "var(--color-muted)",
  marginBottom: "6px",
};

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const focusStyle = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "rgba(59,130,246,0.5)";
    e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.12)";
  };
  const blurStyle = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "rgba(255,255,255,0.08)";
    e.target.style.boxShadow = "none";
  };

  async function onSubmit(data: RegisterInput) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? "Erro ao criar conta");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.03em", marginBottom: "6px" }}>
        Crie sua conta
      </h1>
      <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "28px" }}>
        Comece a organizar suas finanças hoje
      </p>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", fontSize: "14px", borderRadius: "10px", padding: "12px 14px", marginBottom: "16px" }}>
          {error}
        </div>
      )}

      <label style={labelStyle}>Nome completo</label>
      <input {...register("name")} type="text" placeholder="João Silva" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
      {errors.name && <p style={{ color: "#f87171", fontSize: "12px", marginTop: "-12px", marginBottom: "12px" }}>{errors.name.message}</p>}

      <label style={labelStyle}>E-mail</label>
      <input {...register("email")} type="email" placeholder="seu@email.com" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
      {errors.email && <p style={{ color: "#f87171", fontSize: "12px", marginTop: "-12px", marginBottom: "12px" }}>{errors.email.message}</p>}

      <label style={labelStyle}>Senha</label>
      <input {...register("password")} type="password" placeholder="Mínimo 8 caracteres" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
      {errors.password && <p style={{ color: "#f87171", fontSize: "12px", marginTop: "-12px", marginBottom: "12px" }}>{errors.password.message}</p>}

      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%", padding: "13px",
          background: loading ? "rgba(59,130,246,0.5)" : "linear-gradient(135deg, #3b82f6, #2563eb)",
          border: "none", borderRadius: "10px", color: "#fff",
          fontSize: "15px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
          marginTop: "4px", boxShadow: "0 4px 20px rgba(59,130,246,0.35)",
        }}
      >
        {loading ? "Criando conta..." : "Criar conta"}
      </button>
    </form>
  );
}
