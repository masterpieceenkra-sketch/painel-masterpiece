"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface PlaybookInput {
  slug: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  content_mdx: string;
  video_url: string;
  pdf_url: string;
  order_index: number;
  status: "draft" | "published";
}

function parseForm(formData: FormData): PlaybookInput {
  return {
    slug: String(formData.get("slug") ?? "").trim(),
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    icon: String(formData.get("icon") ?? "").trim(),
    content_mdx: String(formData.get("content_mdx") ?? ""),
    video_url: String(formData.get("video_url") ?? "").trim(),
    pdf_url: String(formData.get("pdf_url") ?? "").trim(),
    order_index: Number(formData.get("order_index") ?? 0),
    status:
      String(formData.get("status") ?? "draft") === "published"
        ? "published"
        : "draft",
  };
}

function parseChecklistItems(formData: FormData) {
  const raw = String(formData.get("checklist_json") ?? "[]");
  try {
    const parsed = JSON.parse(raw) as Array<{
      section?: string | null;
      label: string;
    }>;
    return parsed
      .filter((i) => i && typeof i.label === "string" && i.label.trim())
      .map((i, idx) => ({
        section: i.section?.trim() || null,
        label: i.label.trim(),
        order_index: idx,
      }));
  } catch {
    return [];
  }
}

export async function createPlaybookAction(formData: FormData) {
  const input = parseForm(formData);
  const items = parseChecklistItems(formData);
  const supabase = await createSupabaseServerClient();

  const { data: created, error } = await supabase
    .from("playbooks")
    .insert({
      slug: input.slug,
      title: input.title,
      description: input.description || null,
      category: input.category || null,
      icon: input.icon || null,
      content_mdx: input.content_mdx,
      video_url: input.video_url || null,
      pdf_url: input.pdf_url || null,
      order_index: input.order_index,
      status: input.status,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  if (items.length > 0) {
    await supabase
      .from("checklist_items")
      .insert(items.map((i) => ({ ...i, playbook_id: created.id })));
  }

  revalidatePath("/admin/playbooks");
  revalidatePath("/dashboard");
  redirect(`/admin/playbooks/${created.id}/edit?saved=1`);
}

export async function updatePlaybookAction(id: string, formData: FormData) {
  const input = parseForm(formData);
  const items = parseChecklistItems(formData);
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("playbooks")
    .update({
      slug: input.slug,
      title: input.title,
      description: input.description || null,
      category: input.category || null,
      icon: input.icon || null,
      content_mdx: input.content_mdx,
      video_url: input.video_url || null,
      pdf_url: input.pdf_url || null,
      order_index: input.order_index,
      status: input.status,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  // Replace checklist items
  await supabase.from("checklist_items").delete().eq("playbook_id", id);
  if (items.length > 0) {
    await supabase
      .from("checklist_items")
      .insert(items.map((i) => ({ ...i, playbook_id: id })));
  }

  revalidatePath("/admin/playbooks");
  revalidatePath("/dashboard");
  revalidatePath(`/playbooks/${input.slug}`);
  redirect(`/admin/playbooks/${id}/edit?saved=1`);
}

export async function deletePlaybookAction(id: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("playbooks").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/playbooks");
  redirect("/admin/playbooks");
}
