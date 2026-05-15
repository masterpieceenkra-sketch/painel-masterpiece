"use client";

import { useRef, useState } from "react";
import { Upload, Trash2, FileText } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface Props {
  name: string;
  defaultValue?: string;
}

export function PdfUpload({ name, defaultValue }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function fileNameFromUrl(u: string): string | null {
    try {
      const parsed = new URL(u);
      const last = parsed.pathname.split("/").pop();
      return last ? decodeURIComponent(last) : null;
    } catch {
      return null;
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Apenas PDF é permitido.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError("Arquivo maior que 50MB.");
      return;
    }

    setError(null);
    setUploading(true);

    const supabase = createSupabaseBrowserClient();
    const safeName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const path = `playbooks/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("playbook-assets")
      .upload(path, file, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("playbook-assets")
      .getPublicUrl(path);

    setUrl(data.publicUrl);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function clearUrl() {
    setUrl("");
    setError(null);
  }

  const currentFileName = url ? fileNameFromUrl(url) : null;

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={url} readOnly />

      {url ? (
        <div className="flex items-center justify-between gap-3 rounded-sm border border-[var(--border-strong)] bg-[var(--navy-light)]/60 p-3">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-[var(--gold)] hover:text-[var(--gold-light)] truncate"
          >
            <FileText className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{currentFileName ?? url}</span>
          </a>
          <button
            type="button"
            onClick={clearUrl}
            className="text-[var(--red)] hover:text-[var(--red)]/80"
            aria-label="Remover PDF"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="btn-ghost text-[11px] px-4 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Upload className="h-3.5 w-3.5" />
            {uploading ? "Enviando…" : "Selecionar PDF"}
          </button>
          <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
            ou cole uma URL
          </span>
          <input
            type="url"
            placeholder="https://…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="input-masterpiece flex-1 text-xs"
          />
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        onChange={onFile}
        className="hidden"
      />

      {error && (
        <p className="text-xs text-[var(--red)]">{error}</p>
      )}
    </div>
  );
}
