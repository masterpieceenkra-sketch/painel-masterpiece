import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createPlaybookAction } from "../actions";
import { PlaybookForm } from "../playbook-form";

export default function NewPlaybookPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <Link
        href="/admin/playbooks"
        className="mb-8 inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[var(--muted)] hover:text-[var(--gold)]"
      >
        <ArrowLeft className="h-3 w-3" /> Voltar
      </Link>
      <div className="brand-logo mb-3">Admin</div>
      <h1 className="mb-3 text-3xl">Novo playbook</h1>
      <div className="gold-line mb-10" />
      <PlaybookForm action={createPlaybookAction} submitLabel="Criar" />
    </div>
  );
}
