"use client";

import { useEffect, useState, useTransition } from "react";
import { Check } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface Item {
  id: string;
  section: string | null;
  label: string;
  order_index: number;
}

interface Props {
  playbookId: string;
}

export function Checklist({ playbookId }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [checkedSet, setCheckedSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let active = true;
    (async () => {
      const [{ data: itemsData }, userRes] = await Promise.all([
        supabase
          .from("checklist_items")
          .select("id, section, label, order_index")
          .eq("playbook_id", playbookId)
          .order("order_index", { ascending: true }),
        supabase.auth.getUser(),
      ]);
      if (!active) return;
      setItems(itemsData ?? []);

      const userId = userRes.data.user?.id;
      if (userId && itemsData && itemsData.length > 0) {
        const { data: progress } = await supabase
          .from("checklist_progress")
          .select("item_id")
          .eq("user_id", userId)
          .in(
            "item_id",
            itemsData.map((i) => i.id),
          );
        if (!active) return;
        setCheckedSet(new Set((progress ?? []).map((p) => p.item_id)));
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [playbookId]);

  function toggle(itemId: string) {
    const wasChecked = checkedSet.has(itemId);
    const next = new Set(checkedSet);
    if (wasChecked) next.delete(itemId);
    else next.add(itemId);
    setCheckedSet(next);

    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      if (wasChecked) {
        await supabase
          .from("checklist_progress")
          .delete()
          .eq("user_id", user.id)
          .eq("item_id", itemId);
      } else {
        await supabase
          .from("checklist_progress")
          .insert({ user_id: user.id, item_id: itemId });
      }
    });
  }

  if (loading) {
    return (
      <div className="my-8 text-sm text-[var(--muted)]">
        Carregando checklist…
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  // Group by section
  const sections = new Map<string, Item[]>();
  for (const item of items) {
    const key = item.section ?? "__default";
    if (!sections.has(key)) sections.set(key, []);
    sections.get(key)!.push(item);
  }

  const totalDone = checkedSet.size;
  const total = items.length;
  const pct = total > 0 ? Math.round((totalDone / total) * 100) : 0;

  return (
    <div className="my-10">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="font-display text-lg text-[var(--gold)]">Checklist</h3>
        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          <span>
            {totalDone}/{total}
          </span>
          <div className="h-1 w-24 overflow-hidden rounded-full bg-[var(--navy-light)]">
            <div
              className="h-full bg-[var(--gold)] transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {[...sections.entries()].map(([section, sectionItems]) => (
        <div key={section} className="mb-8 last:mb-0">
          {section !== "__default" && (
            <div className="mb-3 text-[10px] uppercase tracking-[0.3em] text-[var(--gold)]/80">
              {section}
            </div>
          )}
          <ul className="space-y-2">
            {sectionItems.map((item) => {
              const checked = checkedSet.has(item.id);
              return (
                <li key={item.id}>
                  <button
                    onClick={() => toggle(item.id)}
                    disabled={pending}
                    className="group flex w-full items-start gap-3 rounded-sm border border-[var(--border)] bg-[var(--navy-light)]/40 p-4 text-left transition hover:border-[var(--border-strong)]"
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-sm border transition ${
                        checked
                          ? "border-[var(--gold)] bg-[var(--gold)]"
                          : "border-[var(--border-strong)]"
                      }`}
                    >
                      {checked && (
                        <Check className="h-3.5 w-3.5 text-[var(--navy)]" strokeWidth={3} />
                      )}
                    </span>
                    <span
                      className={`text-sm leading-relaxed ${
                        checked
                          ? "text-[var(--white)]/50 line-through"
                          : "text-[var(--white)]/90"
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
