import type { Action, Position } from "@/domain/cards";
import { POSITION_LABEL_PT } from "@/domain/cards";
import { cn } from "@/lib/cn";
import { ActionBadge } from "./ActionBadge";
import { ChipStack } from "./ChipStack";
import { DealerButton } from "./DealerButton";

export type SeatStatus = "hero" | "to-act" | "folded" | "acted" | "acting";

type Props = {
  position: Position;
  status: SeatStatus;
  stackBB: number;
  lastAction?: Action;
  isDealer?: boolean;
  isHero?: boolean;
};

const TONE: Record<SeatStatus, string> = {
  hero: "border-emerald-400/70 bg-emerald-950/70 ring-2 ring-emerald-400/60 shadow-emerald-500/30",
  "to-act": "border-slate-700 bg-slate-900/80",
  folded: "border-slate-800 bg-slate-950/60 opacity-40",
  acted: "border-slate-700 bg-slate-900/70",
  acting: "border-amber-400/70 bg-amber-950/40 ring-2 ring-amber-400/60",
};

export function Seat({
  position,
  status,
  stackBB,
  lastAction,
  isDealer,
  isHero,
}: Props) {
  const label = POSITION_LABEL_PT[position];
  const heroGlow = isHero || status === "hero";
  return (
    <div
      role="group"
      aria-label={`${label}${heroGlow ? " (você)" : ""} — ${stackBB} BB${
        status === "folded" ? " — fold" : ""
      }${status === "acting" ? " — pensando" : ""}`}
      className={cn(
        "relative flex flex-col items-center gap-1 rounded-xl border px-2 py-1.5 shadow-lg backdrop-blur-sm transition-colors",
        TONE[status],
        heroGlow && "poker-glow-pulse",
      )}
    >
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "text-[10px] font-semibold uppercase tracking-wider",
            heroGlow ? "text-emerald-200" : "text-slate-300",
          )}
        >
          {label}
        </span>
        {isDealer && <DealerButton size="sm" />}
      </div>
      <ChipStack stackBB={stackBB} size="sm" />
      {lastAction && (
        <div className="mt-0.5">
          <ActionBadge action={lastAction} />
        </div>
      )}
    </div>
  );
}
