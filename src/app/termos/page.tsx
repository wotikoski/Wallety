import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Termos de Uso – Wallety",
  description: "Termos de Uso da plataforma Wallety.",
};

const sections = [
  {
    number: "1",
    title: "Objeto",
    body: "O Wallety é uma aplicação de gestão financeira pessoal com foco em simplicidade, que permite ao usuário registrar receitas, despesas e acompanhar sua situação financeira.",
  },
  {
    number: "2",
    title: "Condições de Uso",
    body: "O usuário se compromete a fornecer informações verdadeiras no momento do cadastro e a não utilizar a plataforma para quaisquer fins ilícitos, fraudulentos ou que violem direitos de terceiros.",
  },
  {
    number: "3",
    title: "Limitação de Responsabilidade",
    body: "O serviço é fornecido \"como está\", sem garantias expressas ou implícitas de qualquer natureza. O Wallety não se responsabiliza por perdas financeiras decorrentes de decisões tomadas com base nas informações exibidas na plataforma, nem por eventuais falhas, indisponibilidades ou erros do sistema.",
  },
  {
    number: "4",
    title: "Privacidade",
    body: "O uso da plataforma implica concordância com a Política de Privacidade, disponível em /privacidade. Recomendamos a leitura antes de criar sua conta.",
  },
  {
    number: "5",
    title: "Modificações",
    body: "Estes Termos podem ser alterados a qualquer momento. Alterações relevantes serão comunicadas por e-mail ou por aviso na plataforma. O uso continuado após as alterações implica aceitação das novas condições.",
  },
  {
    number: "6",
    title: "Contato e Controlador dos Dados",
    body: null,
    contact: true,
  },
];

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link href="/login" className="flex items-center group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-blue.png" alt="Wallety" className="h-8 w-auto" />
          </Link>
          <span className="text-slate-300 text-lg font-light select-none">/</span>
          <span className="text-sm font-medium text-slate-500">Termos de Uso</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        {/* Title block */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Termos de Uso</h1>
          <p className="text-sm text-slate-400">Última atualização: 21 de abril de 2026</p>
          <p className="mt-4 text-sm text-slate-600 leading-relaxed">
            Ao acessar ou usar o Wallety você concorda com os termos abaixo. Leia com atenção antes
            de criar sua conta ou continuar usando a plataforma.
          </p>
        </div>

        {/* Sections */}
        {sections.map((s) => (
          <div key={s.number} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
            <div className="flex items-start gap-4">
              <span className="shrink-0 w-8 h-8 rounded-lg bg-brand-50 text-brand-600 text-sm font-bold flex items-center justify-center">
                {s.number}
              </span>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-slate-900 mb-2">{s.title}</h2>
                {s.contact ? (
                  <div className="text-sm text-slate-600 space-y-1">
                    <p><span className="font-medium text-slate-700">Controlador:</span> Leonardo Schneider</p>
                    <p>
                      <span className="font-medium text-slate-700">E-mail:</span>{" "}
                      <a href="mailto:leonardoschneider@outlook.pt" className="text-brand-600 hover:underline">
                        leonardoschneider@outlook.pt
                      </a>
                    </p>
                    <p><span className="font-medium text-slate-700">Localização:</span> Colatina – ES, Brasil</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-600 leading-relaxed">{s.body}</p>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Footer links */}
        <div className="text-center py-4 space-x-4 text-sm text-slate-400">
          <Link href="/privacidade" className="hover:text-brand-600 transition">
            Política de Privacidade
          </Link>
          <span>·</span>
          <Link href="/login" className="hover:text-brand-600 transition">
            Voltar ao login
          </Link>
        </div>
      </main>
    </div>
  );
}
