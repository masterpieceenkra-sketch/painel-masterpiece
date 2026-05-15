import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  deletePlaybookAction,
  updatePlaybookAction,
} from "../../actions";
import { PlaybookForm } from "../../playbook-form";

export default async function EditPlaybookPage(
  props: PageProps<"/admin/playbooks/[id]/edit">,
) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const saved = searchParams?.saved === "1";

  const supabase = await createSupabaseServerClient();
  const { data: playbook } = await supabase
    .from("playbooks")
    .select(
      "id, slug, title, description, category, icon, content_mdx, video_url, pdf_url, order_index, status",
    )
    .eq("id", id)
    .maybeSingle();

  if (!playbook) notFound();

  const { data: items } = await supabase
    .from("checklist_items")
    .select("section, label, order_index")
    .eq("playbook_id", id)
    .order("order_index", { ascending: true });

  const updateAction = updatePlaybookAction.bind(null, id);
  const deleteAction = deletePlaybookAction.bind(null, id);

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <Link
        href="/admin/playbooks"
        className="mb-8 inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[var(--muted)] hover:text-[var(--gold)]"
      >
        <ArrowLeft className="h-3 w-3" /> Voltar
      </Link>
      <div className="brand-logo mb-3">Admin</div>
      <h1 className="mb-3 text-3xl">Editar: {playbook.title}</h1>
      <div className="gold-line mb-10" />
      <PlaybookForm
        action={updateAction}
        deleteAction={deleteAction}
        submitLabel="Salvar alterações"
        saved={saved}
        initial={{
          ...playbook,
          status: playbook.status === "published" ? "published" : "draft",
        }}
        initialItems={(items ?? []).map((i) => ({
          section: i.section,
          label: i.label,
        }))}
      />
    </div>
  );
}
