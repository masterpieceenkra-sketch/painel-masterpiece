import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <div className="brand-logo mb-8">Masterpiece · Mentoria</div>
      <div className="gold-line mx-auto mb-10" />
      <h1 className="mb-6 text-4xl sm:text-5xl">O painel da Mentoria</h1>
      <p className="mb-12 max-w-xl text-base text-[var(--white)]/80">
        Hub central com todos os playbooks, checklists e tutoriais da
        Masterpiece. Acesso liberado para mentorados cadastrados.
      </p>
      <Link href="/login" className="btn-primary">
        Entrar no painel
      </Link>
      <p className="mt-12 text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
        Acesso restrito · Mentoria Masterpiece
      </p>
    </main>
  );
}
