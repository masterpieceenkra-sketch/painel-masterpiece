import { ACTION_LABEL_PT, type ActionKind } from "@/domain/cards";
import { formatFreq } from "@/lib/format";

const COLOR: Record<ActionKind, string> = {
  fold: "bg-slate-500",
  call: "bg-sky-500",
  check: "bg-sky-500",
  raise: "bg-amber-500",
  jam: "bg-rose-500",
};

// Tiny inline glyph per action — adds quick recognition in the legend without
// pulling an icon library.
function ActionIcon({
  kind,
  className,
}: {
  kind: ActionKind;
  className?: string;
}) {
  const props = {
    viewBox: "0 0 16 16",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className,
  };
  switch (kind) {
    case "fold":
      // Diagonal slash / pass
      return (
        <svg {...props}>
          <line x1="3" y1="13" x2="13" y2="3" />
        </svg>
      );
    case "call":
      // Equal / match
      return (
        <svg {...props}>
          <line x1="3" y1="6" x2="13" y2="6" />
          <line x1="3" y1="10" x2="13" y2="10" />
        </svg>
      );
    case "check":
      // Checkmark
      return (
        <svg {...props}>
          <path d="m3 8 3 3 7-7" />
        </svg>
      );
    case "raise":
      // Up arrow
      return (
        <svg {...props}>
          <line x1="8" y1="13" x2="8" y2="3" />
          <path d="m4 7 4-4 4 4" />
        </svg>
      );
    case "jam":
      // Lightning / all-in
      return (
        <svg {...props}>
          <path d="M9 2 3 9h4l-1 5 6-7H8l1-5Z" />
        </svg>
      );
  }
}

export function MixBar({ mix }: { mix: { kind: ActionKind; freq: number }[] }) {
  if (mix.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-800 shadow-inner ring-1 ring-inset ring-black/30">
        {mix.map((m) => {
          const pct = m.freq * 100;
          const showLabel = pct > 15;
          const label = ACTION_LABEL_PT[m.kind].toUpperCase();
          return (
            <div
              key={m.kind}
              className={`${COLOR[m.kind]} relative flex items-center justify-center overflow-hidden text-[10px] font-semibold leading-none text-white/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-1px_0_rgba(0,0,0,0.25)]`}
              style={{ width: `${pct}%` }}
              title={`${ACTION_LABEL_PT[m.kind]} ${formatFreq(m.freq)}`}
              aria-label={`${ACTION_LABEL_PT[m.kind]} ${formatFreq(m.freq)}`}
            >
              {showLabel && (
                <span className="truncate px-1 tracking-wide">
                  {label} {Math.round(pct)}%
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-slate-300">
        {mix.map((m) => (
          <span key={m.kind} className="inline-flex items-center gap-1.5">
            <span
              className={`inline-flex h-3.5 w-3.5 items-center justify-center rounded-sm text-white/95 ${COLOR[m.kind]}`}
              aria-hidden="true"
            >
              <ActionIcon kind={m.kind} className="h-2.5 w-2.5" />
            </span>
            {ACTION_LABEL_PT[m.kind]}{" "}
            <span className="font-mono text-slate-400">{formatFreq(m.freq)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
