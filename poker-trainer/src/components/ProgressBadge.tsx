import { formatPct } from "@/lib/format";
import { cn } from "@/lib/cn";

export function ProgressBadge({
  attempts,
  target,
  correctPct,
}: {
  attempts: number;
  target: number;
  correctPct: number;
}) {
  const tone =
    attempts === 0
      ? "bg-slate-700 text-slate-300"
      : correctPct >= 85
        ? "bg-emerald-700 text-emerald-50"
        : correctPct >= 65
          ? "bg-amber-700 text-amber-50"
          : "bg-rose-700 text-rose-50";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tone,
      )}
    >
      {attempts === 0 ? (
        "Sem tentativas"
      ) : (
        <>
          {formatPct(correctPct)} <span className="opacity-70">·</span> {attempts}/{target}
        </>
      )}
    </span>
  );
}
