"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSignOut() {
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <button
      onClick={onSignOut}
      disabled={pending}
      className="text-xs uppercase tracking-[0.2em] text-[var(--white)]/80 hover:text-[var(--gold)] transition disabled:opacity-60"
    >
      {pending ? "Saindo…" : "Sair"}
    </button>
  );
}
