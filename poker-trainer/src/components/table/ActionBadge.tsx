import type { Action } from "@/domain/cards";
import { cn } from "@/lib/cn";

const FOLD =
  "bg-slate-800/80 text-slate-400 line-through decoration-slate-500";
const CALL = "bg-sky-900/80 text-sky-200";
const CHECK = "bg-sky-900/60 text-sky-200";
const RAISE = "bg-amber-800/80 text-amber-100";
const JAM = "bg-rose-800/90 text-rose-100";

function labelFor(a: Action): string {
  switch (a.kind) {
    case "fold":
      return "Fold";
    case "call":
      return "Call";
    case "check":
      return "Check";
    case "raise":
      return `Raise ${a.sizeBB}BB`;
    case "jam":
      return "ALL-IN";
  }
}

function toneFor(a: Action): string {
  switch (a.kind) {
    case "fold":
      return FOLD;
    case "call":
      return CALL;
    case "check":
      return CHECK;
    case "raise":
      return RAISE;
    case "jam":
      return JAM;
  }
}

export function ActionBadge({ action }: { action: Action }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide shadow-sm",
        toneFor(action),
      )}
    >
      {labelFor(action)}
    </span>
  );
}
