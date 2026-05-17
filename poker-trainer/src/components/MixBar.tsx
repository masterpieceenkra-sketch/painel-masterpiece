import { ACTION_LABEL_PT, type ActionKind } from "@/domain/cards";
import { formatFreq } from "@/lib/format";

const COLOR: Record<ActionKind, string> = {
  fold: "bg-slate-500",
  call: "bg-sky-500",
  check: "bg-sky-500",
  raise: "bg-amber-500",
  jam: "bg-rose-500",
};

export function MixBar({ mix }: { mix: { kind: ActionKind; freq: number }[] }) {
  if (mix.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-800">
        {mix.map((m) => (
          <div
            key={m.kind}
            className={COLOR[m.kind]}
            style={{ width: `${m.freq * 100}%` }}
            aria-label={`${ACTION_LABEL_PT[m.kind]} ${formatFreq(m.freq)}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-slate-300">
        {mix.map((m) => (
          <span key={m.kind} className="inline-flex items-center gap-1">
            <span className={`inline-block h-2 w-2 rounded-sm ${COLOR[m.kind]}`} />
            {ACTION_LABEL_PT[m.kind]} <span className="font-mono">{formatFreq(m.freq)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
