import type { ReactNode } from "react";
import type { EvBucket } from "@/domain/progress";

// Inline SVGs (no external deps). Sized to inherit currentColor so we can tint
// them with the same `text` token used by the panel headline.
function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m8 12 3 3 5-6" />
    </svg>
  );
}

function TriangleAlertIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function XCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

export type BucketStyle = {
  border: string;
  bg: string;
  label: string;
  text: string;
  icon: (props: { className?: string }) => ReactNode;
};

export const BUCKET_STYLES: Record<EvBucket, BucketStyle> = {
  perfect: {
    border: "border-emerald-500",
    bg: "bg-emerald-950",
    label: "Perfeito",
    text: "text-emerald-300",
    icon: CheckCircleIcon,
  },
  minor: {
    border: "border-yellow-500",
    bg: "bg-yellow-950",
    label: "Erro pequeno",
    text: "text-yellow-300",
    icon: XCircleIcon,
  },
  medium: {
    border: "border-orange-500",
    bg: "bg-orange-950",
    label: "Erro médio",
    text: "text-orange-300",
    icon: XCircleIcon,
  },
  major: {
    border: "border-rose-500",
    bg: "bg-rose-950",
    label: "Erro grande",
    text: "text-rose-300",
    icon: XCircleIcon,
  },
};

// Variant used when an action is right but sizing is off. Same shape as
// BUCKET_STYLES entries so callers can use it interchangeably.
export const SIZING_MISS_STYLE: BucketStyle = {
  border: "border-amber-600",
  bg: "bg-amber-950/70",
  text: "text-amber-200",
  label: "Sizing fora",
  icon: TriangleAlertIcon,
};

// Stacked-chips graphic used by feedback panels. Inherits color via
// `fill="currentColor"` so callers tint with text-* utilities.
export function ChipPile({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      {/* shadow base */}
      <ellipse cx="24" cy="40" rx="14" ry="2.5" opacity="0.35" />
      {/* 5 stacked chips, lightest on top */}
      <rect x="10" y="30" width="28" height="6" rx="3" opacity="0.55" />
      <rect x="10" y="24" width="28" height="6" rx="3" opacity="0.65" />
      <rect x="10" y="18" width="28" height="6" rx="3" opacity="0.78" />
      <rect x="10" y="12" width="28" height="6" rx="3" opacity="0.9" />
      <rect x="10" y="6" width="28" height="6" rx="3" />
    </svg>
  );
}
