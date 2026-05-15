import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PlaybookCard } from "@/components/layout/playbook-card";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: playbooks } = await supabase
    .from("playbooks")
    .select("id, slug, title, description, category, icon, status, order_index")
    .eq("status", "published")
    .order("order_index", { ascending: true });

  // Progresso por playbook (count de itens checados / total)
  const playbookIds = (playbooks ?? []).map((p) => p.id);
  let progress: Record<string, { done: number; total: number }> = {};

  if (playbookIds.length > 0) {
    const [{ data: items }, { data: checked }] = await Promise.all([
      supabase
        .from("checklist_items")
        .select("id, playbook_id")
        .in("playbook_id", playbookIds),
      user
        ? supabase
            .from("checklist_progress")
            .select("item_id")
            .eq("user_id", user.id)
        : Promise.resolve({ data: [] as { item_id: string }[] }),
    ]);

    const itemToPlaybook = new Map(
      (items ?? []).map((i) => [i.id, i.playbook_id]),
    );
    const totals: Record<string, number> = {};
    for (const i of items ?? []) {
      totals[i.playbook_id] = (totals[i.playbook_id] ?? 0) + 1;
    }
    const dones: Record<string, number> = {};
    for (const c of checked ?? []) {
      const pid = itemToPlaybook.get(c.item_id);
      if (pid) dones[pid] = (dones[pid] ?? 0) + 1;
    }
    progress = Object.fromEntries(
      playbookIds.map((pid) => [
        pid,
        { done: dones[pid] ?? 0, total: totals[pid] ?? 0 },
      ]),
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-12">
        <div className="brand-logo mb-4">Mentoria Masterpiece</div>
        <h1 className="text-3xl sm:text-4xl mb-3">Seus Playbooks</h1>
        <div className="gold-line mb-6" />
        <p className="text-sm text-[var(--white)]/70 max-w-2xl">
          Todo o material da mentoria em um só lugar. Checklists, tutoriais e
          campanhas de teste para você executar com método.
        </p>
      </div>

      {!playbooks || playbooks.length === 0 ? (
        <div className="card-masterpiece p-12 text-center">
          <p className="text-[var(--white)]/80 mb-4">
            Nenhum playbook publicado ainda.
          </p>
          <Link href="/admin/playbooks" className="btn-ghost">
            Ir para o admin
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {playbooks.map((p) => (
            <PlaybookCard
              key={p.id}
              slug={p.slug}
              title={p.title}
              description={p.description}
              category={p.category}
              icon={p.icon}
              progress={progress[p.id]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
