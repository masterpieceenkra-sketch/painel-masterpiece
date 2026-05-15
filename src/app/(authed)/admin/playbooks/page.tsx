import Link from "next/link";
import { Plus, Edit3 } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminPlaybooksPage() {
  const supabase = await createSupabaseServerClient();
  const { data: playbooks } = await supabase
    .from("playbooks")
    .select("id, slug, title, category, status, order_index, updated_at")
    .order("order_index", { ascending: true });

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <div className="brand-logo mb-3">Admin</div>
          <h1 className="text-3xl">Playbooks</h1>
          <div className="gold-line mt-4" />
        </div>
        <Link href="/admin/playbooks/new" className="btn-primary">
          <Plus className="h-4 w-4" /> Novo
        </Link>
      </div>

      {!playbooks || playbooks.length === 0 ? (
        <div className="card-masterpiece p-12 text-center">
          <p className="mb-6 text-[var(--white)]/80">
            Nenhum playbook cadastrado.
          </p>
          <Link href="/admin/playbooks/new" className="btn-ghost">
            Criar o primeiro
          </Link>
        </div>
      ) : (
        <div className="card-masterpiece overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-[10px] uppercase tracking-[0.25em] text-[var(--muted)]">
                <th className="px-5 py-4">Título</th>
                <th className="px-5 py-4">Slug</th>
                <th className="px-5 py-4">Categoria</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {playbooks.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-[var(--border)]/40 last:border-b-0 hover:bg-[var(--navy-light)]/50 transition"
                >
                  <td className="px-5 py-4 text-sm">{p.title}</td>
                  <td className="px-5 py-4 text-xs text-[var(--muted)] font-mono">
                    {p.slug}
                  </td>
                  <td className="px-5 py-4 text-xs text-[var(--white)]/70">
                    {p.category ?? "—"}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-sm border ${
                        p.status === "published"
                          ? "border-[var(--green)] text-[var(--green)]"
                          : "border-[var(--muted)] text-[var(--muted)]"
                      }`}
                    >
                      {p.status === "published" ? "Publicado" : "Rascunho"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/admin/playbooks/${p.id}/edit`}
                      className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-[var(--gold)] hover:text-[var(--gold-light)]"
                    >
                      <Edit3 className="h-3 w-3" /> Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
