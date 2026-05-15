import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MdxRenderer } from "@/components/masterpiece/mdx-renderer";
import { VideoEmbed } from "@/components/masterpiece/VideoEmbed";

export default async function PlaybookPage(
  props: PageProps<"/playbooks/[slug]">,
) {
  const { slug } = await props.params;
  const supabase = await createSupabaseServerClient();

  const { data: playbook } = await supabase
    .from("playbooks")
    .select(
      "id, slug, title, description, category, content_mdx, video_url, pdf_url",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!playbook) {
    notFound();
  }

  // Fire-and-forget view tracking
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase
      .from("playbook_views")
      .insert({ user_id: user.id, playbook_id: playbook.id });
  }

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/dashboard"
        className="mb-10 inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[var(--muted)] hover:text-[var(--gold)] transition"
      >
        <ArrowLeft className="h-3 w-3" /> Voltar
      </Link>

      <header className="mb-12 text-center">
        {playbook.category && (
          <div className="doc-badge mb-6">{playbook.category}</div>
        )}
        <h1 className="mb-4 text-3xl sm:text-4xl">{playbook.title}</h1>
        <div className="gold-line mx-auto mb-6" />
        {playbook.description && (
          <p className="mx-auto max-w-2xl text-base text-[var(--white)]/75">
            {playbook.description}
          </p>
        )}
      </header>

      {playbook.video_url && <VideoEmbed url={playbook.video_url} />}

      {playbook.content_mdx && (
        <MdxRenderer
          source={playbook.content_mdx}
          playbookId={playbook.id}
        />
      )}

      {playbook.pdf_url && (
        <div className="mt-10 text-center">
          <a
            href={playbook.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost"
          >
            Baixar PDF
          </a>
        </div>
      )}
    </article>
  );
}
