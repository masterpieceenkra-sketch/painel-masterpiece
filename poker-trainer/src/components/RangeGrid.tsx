import { type ActionKind, type HandCode } from "@/domain/cards";
import { getMix, type PreflopRange } from "@/domain/range";
import { cn } from "@/lib/cn";
import { formatFreq } from "@/lib/format";

const GRID_RANKS = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"] as const;

const ACTION_COLOR: Record<ActionKind, string> = {
  fold: "bg-slate-700",
  call: "bg-sky-600",
  check: "bg-sky-600",
  raise: "bg-amber-500",
  jam: "bg-rose-600",
};

const ACTION_ORDER: ActionKind[] = ["jam", "raise", "call", "check", "fold"];

function handAt(row: number, col: number): HandCode {
  if (row === col) return `${GRID_RANKS[row]}${GRID_RANKS[col]}`;
  if (row < col) return `${GRID_RANKS[row]}${GRID_RANKS[col]}s`;
  return `${GRID_RANKS[col]}${GRID_RANKS[row]}o`;
}

export function RangeGrid({
  range,
  highlightHand,
  className,
}: {
  range: PreflopRange;
  highlightHand?: HandCode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-grid w-full max-w-3xl gap-px rounded border border-slate-800 bg-slate-800 p-px",
        className,
      )}
      style={{ gridTemplateColumns: "repeat(13, minmax(0, 1fr))" }}
    >
      {GRID_RANKS.map((_, row) =>
        GRID_RANKS.map((__, col) => {
          const hand = handAt(row, col);
          const mix = getMix(range, hand);
          const stacks = ACTION_ORDER.filter((k) => (mix[k] ?? 0) > 0).map((k) => ({
            kind: k,
            freq: mix[k] ?? 0,
          }));
          const highlighted = highlightHand === hand;
          const title = stacks
            .map((s) => `${s.kind} ${formatFreq(s.freq)}`)
            .join(" · ");
          return (
            <div
              key={hand}
              title={`${hand} — ${title}`}
              className={cn(
                "relative flex aspect-square items-center justify-center overflow-hidden text-[10px] font-mono font-semibold text-white shadow-inner sm:text-xs",
                highlighted && "ring-2 ring-emerald-400 ring-offset-1 ring-offset-slate-900 z-10",
              )}
            >
              <div className="absolute inset-0 flex flex-col">
                {stacks.map((s) => (
                  <div
                    key={s.kind}
                    className={ACTION_COLOR[s.kind]}
                    style={{ height: `${s.freq * 100}%` }}
                  />
                ))}
              </div>
              <span className="relative z-[1] drop-shadow-[0_1px_1px_rgba(0,0,0,0.85)]">
                {hand}
              </span>
            </div>
          );
        }),
      )}
    </div>
  );
}

export function RangeLegend({ range }: { range: PreflopRange }) {
  const seen = new Set<ActionKind>();
  for (const mix of Object.values(range.cells)) {
    for (const k of Object.keys(mix) as ActionKind[]) {
      if ((mix[k] ?? 0) > 0) seen.add(k);
    }
  }
  for (const k of Object.keys(range.defaultFrequencies) as ActionKind[]) {
    if ((range.defaultFrequencies[k] ?? 0) > 0) seen.add(k);
  }
  const items = ACTION_ORDER.filter((k) => seen.has(k));
  return (
    <div className="flex flex-wrap gap-3 text-xs text-slate-400">
      {items.map((k) => (
        <span key={k} className="inline-flex items-center gap-1.5">
          <span className={cn("inline-block h-3 w-3 rounded-sm", ACTION_COLOR[k])} />
          <span className="capitalize">{k === "jam" ? "all-in" : k}</span>
        </span>
      ))}
    </div>
  );
}
