import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/layout/sign-out-button";

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role")
    .eq("id", user.id)
    .maybeSingle();

  const isAdmin = profile?.role === "admin";

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-[var(--border)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="brand-logo">Masterpiece</span>
            <span className="text-[var(--gold)]">·</span>
            <span className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
              Painel
            </span>
          </Link>
          <nav className="flex items-center gap-6 text-xs uppercase tracking-[0.2em]">
            <Link
              href="/dashboard"
              className="text-[var(--white)]/80 hover:text-[var(--gold)] transition"
            >
              Playbooks
            </Link>
            {isAdmin && (
              <Link
                href="/admin/playbooks"
                className="text-[var(--white)]/80 hover:text-[var(--gold)] transition"
              >
                Admin
              </Link>
            )}
            <Link
              href="/account"
              className="text-[var(--white)]/80 hover:text-[var(--gold)] transition"
            >
              Conta
            </Link>
            <SignOutButton />
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-[var(--border)] py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-[10px] uppercase tracking-[0.4em] text-[var(--muted)]">
          Masterpiece · Mentoria
        </div>
      </footer>
    </div>
  );
}
