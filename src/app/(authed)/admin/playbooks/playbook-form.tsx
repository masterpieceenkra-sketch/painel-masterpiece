"use client";

import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { PdfUpload } from "./pdf-upload";

export interface PlaybookFormValues {
  slug?: string;
  title?: string;
  description?: string | null;
  category?: string | null;
  icon?: string | null;
  content_mdx?: string;
  video_url?: string | null;
  pdf_url?: string | null;
  order_index?: number;
  status?: "draft" | "published";
}

export interface ChecklistFormItem {
  section: string | null;
  label: string;
}

interface Props {
  action: (formData: FormData) => void;
  initial?: PlaybookFormValues;
  initialItems?: ChecklistFormItem[];
  submitLabel?: string;
  deleteAction?: () => void;
  saved?: boolean;
}

export function PlaybookForm({
  action,
  initial,
  initialItems,
  submitLabel = "Salvar",
  deleteAction,
  saved,
}: Props) {
  const [items, setItems] = useState<ChecklistFormItem[]>(initialItems ?? []);

  function addItem() {
    setItems([...items, { section: null, label: "" }]);
  }

  function updateItem(idx: number, patch: Partial<ChecklistFormItem>) {
    setItems(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function removeItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx));
  }

  return (
    <form action={action} className="space-y-8">
      <input
        type="hidden"
        name="checklist_json"
        value={JSON.stringify(items)}
      />

      {saved && (
        <div className="rounded-sm border border-[var(--green)]/50 bg-[var(--green)]/10 px-4 py-3 text-sm text-[var(--green)]">
          Salvo com sucesso.
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Título" name="title" required defaultValue={initial?.title} />
        <Field
          label="Slug (URL)"
          name="slug"
          required
          placeholder="checklist-vturb"
          defaultValue={initial?.slug}
        />
        <Field
          label="Categoria"
          name="category"
          placeholder="Tracking, Criativos…"
          defaultValue={initial?.category ?? ""}
        />
        <Field
          label="Ícone"
          name="icon"
          placeholder="book | target | video | file"
          defaultValue={initial?.icon ?? ""}
        />
        <Field
          label="Ordem"
          name="order_index"
          type="number"
          defaultValue={String(initial?.order_index ?? 0)}
        />
        <div>
          <Label>Status</Label>
          <select
            name="status"
            defaultValue={initial?.status ?? "draft"}
            className="input-masterpiece"
          >
            <option value="draft">Rascunho</option>
            <option value="published">Publicado</option>
          </select>
        </div>
      </div>

      <Textarea
        label="Descrição curta"
        name="description"
        rows={2}
        defaultValue={initial?.description ?? ""}
      />

      <Field
        label="URL do vídeo (YouTube / Vimeo / embed)"
        name="video_url"
        defaultValue={initial?.video_url ?? ""}
      />

      <div>
        <Label>PDF (opcional)</Label>
        <PdfUpload name="pdf_url" defaultValue={initial?.pdf_url ?? ""} />
      </div>

      <Textarea
        label="Conteúdo (MDX)"
        name="content_mdx"
        rows={18}
        placeholder={`## Introdução\n\nTexto markdown normal.\n\n<Callout type="warning" title="Atenção">\n  Lembre-se de...\n</Callout>\n\n<Checklist />`}
        defaultValue={initial?.content_mdx ?? ""}
        mono
      />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <Label>Itens da checklist</Label>
          <button type="button" onClick={addItem} className="btn-ghost text-[10px] px-3 py-1.5">
            <Plus className="h-3 w-3" /> Adicionar item
          </button>
        </div>
        {items.length === 0 ? (
          <p className="text-xs text-[var(--muted)]">
            Nenhum item. Adicione para que apareçam quando você usar{" "}
            <code>&lt;Checklist /&gt;</code> no MDX.
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((it, idx) => (
              <div
                key={idx}
                className="flex gap-2 rounded-sm border border-[var(--border)] bg-[var(--navy-light)]/40 p-3"
              >
                <input
                  type="text"
                  placeholder="Seção (opcional)"
                  value={it.section ?? ""}
                  onChange={(e) =>
                    updateItem(idx, { section: e.target.value || null })
                  }
                  className="input-masterpiece w-40 text-xs"
                />
                <input
                  type="text"
                  placeholder="Texto do item"
                  value={it.label}
                  onChange={(e) => updateItem(idx, { label: e.target.value })}
                  className="input-masterpiece flex-1 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="px-3 text-[var(--red)] hover:text-[var(--red)]/80"
                  aria-label="Remover"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-[var(--border)] pt-8">
        {deleteAction ? (
          <DeleteButton action={deleteAction} />
        ) : (
          <span />
        )}
        <button type="submit" className="btn-primary">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 text-[10px] uppercase tracking-[0.25em] text-[var(--muted)]">
      {children}
    </div>
  );
}

function Field({
  label,
  ...rest
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <Label>{label}</Label>
      <input {...rest} className="input-masterpiece" />
    </div>
  );
}

function Textarea({
  label,
  mono,
  ...rest
}: { label: string; mono?: boolean } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <Label>{label}</Label>
      <textarea
        {...rest}
        className={`input-masterpiece resize-y ${mono ? "font-mono text-xs leading-relaxed" : ""}`}
      />
    </div>
  );
}

function DeleteButton({ action }: { action: () => void }) {
  return (
    <form action={action}>
      <button
        type="submit"
        className="text-xs uppercase tracking-[0.2em] text-[var(--red)] hover:text-[var(--red)]/80"
        onClick={(e) => {
          if (!confirm("Excluir este playbook? Esta ação é permanente.")) {
            e.preventDefault();
          }
        }}
      >
        Excluir playbook
      </button>
    </form>
  );
}
