import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acesse sua conta",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center">
              <img src="/logo.png" alt="Wallety" className="w-full h-full object-cover" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">Wallety</span>
          </div>
          <p className="text-brand-200 text-sm">Sua vida financeira, simplificada.</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
