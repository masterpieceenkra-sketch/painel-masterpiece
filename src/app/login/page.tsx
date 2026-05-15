import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="brand-logo mb-6">Masterpiece</div>
          <div className="gold-line mx-auto mb-6" />
          <h1 className="text-2xl mb-3">Entrar no painel</h1>
          <p className="text-sm text-[var(--white)]/70">
            Receba um link mágico no seu email para acessar o conteúdo.
          </p>
        </div>
        <div className="card-masterpiece p-8">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
        <p className="mt-8 text-center text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">
          Acesso restrito · só mentorados cadastrados
        </p>
      </div>
    </main>
  );
}
