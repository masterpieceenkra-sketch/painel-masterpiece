import type { EvBucket } from "@/domain/progress";

export const BUCKET_STYLES: Record<
  EvBucket,
  { border: string; bg: string; label: string; text: string }
> = {
  perfect: {
    border: "border-emerald-500",
    bg: "bg-emerald-950",
    label: "Perfeito",
    text: "text-emerald-300",
  },
  minor: {
    border: "border-yellow-500",
    bg: "bg-yellow-950",
    label: "Erro pequeno",
    text: "text-yellow-300",
  },
  medium: {
    border: "border-orange-500",
    bg: "bg-orange-950",
    label: "Erro médio",
    text: "text-orange-300",
  },
  major: {
    border: "border-rose-500",
    bg: "bg-rose-950",
    label: "Erro grande",
    text: "text-rose-300",
  },
};
