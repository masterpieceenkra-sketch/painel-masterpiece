import { ChipStack } from "./ChipStack";

export function PotDisplay({ potBB }: { potBB: number }) {
  if (potBB <= 0) {
    return (
      <div
        className="rounded-full border border-slate-700/60 bg-slate-900/40 px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-slate-400"
        aria-label="Pot vazio"
      >
        Sem ação ainda
      </div>
    );
  }
  return (
    <div
      className="flex flex-col items-center gap-1"
      aria-label={`Pot: ${potBB} BB`}
    >
      <ChipStack stackBB={potBB} size="sm" ariaHidden />
      <span className="rounded-full bg-slate-950/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-200 ring-1 ring-emerald-700/40">
        Pot: {potBB} BB
      </span>
    </div>
  );
}
