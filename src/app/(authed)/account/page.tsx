import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/layout/sign-out-button";

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role, created_at")
    .eq("id", user!.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="brand-logo mb-4">Conta</div>
      <h1 className="text-3xl mb-3">Sua conta</h1>
      <div className="gold-line mb-12" />

      <div className="card-masterpiece p-8 space-y-5">
        <Field label="Email" value={profile?.email ?? user!.email ?? "—"} />
        <Field label="Nome" value={profile?.full_name ?? "—"} />
        <Field
          label="Tipo de acesso"
          value={profile?.role === "admin" ? "Administrador" : "Mentorado"}
        />
        <Field
          label="Membro desde"
          value={
            profile?.created_at
              ? new Date(profile.created_at).toLocaleDateString("pt-BR")
              : "—"
          }
        />
      </div>

      <div className="mt-10 text-center">
        <SignOutButton />
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--muted)] mb-1">
        {label}
      </div>
      <div className="text-base">{value}</div>
    </div>
  );
}
