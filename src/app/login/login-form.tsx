"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setError(error.message);
      setStatus("error");
      return;
    }
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="text-center">
        <p className="text-base text-[var(--gold)] mb-3">Link enviado ✓</p>
        <p className="text-sm text-[var(--white)]/80">
          Verifique sua caixa de entrada em <strong>{email}</strong> e clique no
          link para entrar.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <label className="flex flex-col gap-2">
        <span className="text-[11px] uppercase tracking-[0.25em] text-[var(--muted)]">
          Email
        </span>
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="voce@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-masterpiece"
        />
      </label>
      <button
        type="submit"
        disabled={status === "sending"}
        className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === "sending" ? "Enviando…" : "Receber link mágico"}
      </button>
      {error && (
        <p className="text-sm text-[var(--red)] text-center">{error}</p>
      )}
    </form>
  );
}
