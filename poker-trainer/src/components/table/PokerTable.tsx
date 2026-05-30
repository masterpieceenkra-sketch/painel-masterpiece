import type { ReactNode } from "react";
import type { Action, Position } from "@/domain/cards";
import { POSITION_LABEL_PT } from "@/domain/cards";
import type { PriorAction } from "@/domain/spots";
import { cn } from "@/lib/cn";
import { DealerButton } from "./DealerButton";
import { PotDisplay } from "./PotDisplay";
import { Seat, type SeatStatus } from "./Seat";
import {
  SEAT_ORDER_6MAX,
  dealerButtonPosition,
  seatPositionFor,
} from "./seatLayout";

type Props = {
  heroPos: Position;
  heroStackBB: number;
  effectiveBB: number;
  prior: PriorAction[];
  potBB?: number;
  centerSlot?: ReactNode;
  villainPos?: Position;
};

type SeatInfo = {
  position: Position;
  status: SeatStatus;
  stackBB: number;
  lastAction?: Action;
  isHero: boolean;
  isDealer: boolean;
};

function buildSeats({
  heroPos,
  heroStackBB,
  effectiveBB,
  prior,
  villainPos,
}: Required<Pick<Props, "heroPos" | "heroStackBB" | "effectiveBB" | "prior">> & {
  villainPos?: Position;
}): SeatInfo[] {
  const priorMap = new Map<Position, Action>();
  for (const p of prior) priorMap.set(p.position, p.action);

  return SEAT_ORDER_6MAX.map((position) => {
    const isHero = position === heroPos;
    const lastAction = priorMap.get(position);
    const isDealer = position === "BTN";

    let status: SeatStatus;
    let stackBB: number;

    if (isHero) {
      status = "hero";
      stackBB = heroStackBB;
    } else if (lastAction && lastAction.kind === "fold") {
      status = "folded";
      stackBB = effectiveBB;
    } else if (lastAction) {
      // Villain or other player who already acted with a non-fold action
      // (raise/call/jam/check). Highlight as the current acting villain if it
      // matches villainPos; otherwise mark as already acted.
      status = villainPos === position ? "acting" : "acted";
      stackBB = effectiveBB;
    } else if (villainPos === position) {
      status = "acting";
      stackBB = effectiveBB;
    } else {
      status = "to-act";
      stackBB = effectiveBB;
    }

    return {
      position,
      status,
      stackBB,
      lastAction,
      isHero,
      isDealer,
    };
  });
}

export function PokerTable({
  heroPos,
  heroStackBB,
  effectiveBB,
  prior,
  potBB = 0,
  centerSlot,
  villainPos,
}: Props) {
  const seats = buildSeats({
    heroPos,
    heroStackBB,
    effectiveBB,
    prior,
    villainPos,
  });
  const dealerBtn = dealerButtonPosition();
  const heroLabel = POSITION_LABEL_PT[heroPos];

  return (
    <section
      aria-label={`Mesa de poker 6-max — você joga ${heroLabel}`}
      className="relative"
    >
      {/* Desktop / tablet: oval table layout (>= 640px) */}
      <div className="hidden sm:block">
        <div
          className="poker-felt relative mx-auto w-full max-w-3xl rounded-[50%] border border-emerald-950/80 shadow-2xl shadow-black/60 ring-1 ring-black/40"
          style={{ aspectRatio: "16 / 10" }}
        >
          {/* Inner rail */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-3 rounded-[50%] border border-emerald-800/50 ring-1 ring-emerald-900/40"
          />
          {/* Center: pot or custom slot (e.g. hero cards). When a centerSlot
              is provided it replaces the pot entirely — postflop boards or
              preflop hole cards already convey the state. */}
          <div
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2"
            style={{ left: "50%", top: "50%" }}
          >
            {centerSlot ?? <PotDisplay potBB={potBB} />}
          </div>

          {/* Dealer button overlay */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${dealerBtn.x}%`, top: `${dealerBtn.y}%` }}
          >
            <DealerButton />
          </div>

          {/* Seats around the rail */}
          {seats.map((s) => {
            const coord = seatPositionFor(s.position);
            return (
              <div
                key={s.position}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${coord.x}%`, top: `${coord.y}%` }}
              >
                <Seat
                  position={s.position}
                  status={s.status}
                  stackBB={s.stackBB}
                  lastAction={s.lastAction}
                  isDealer={s.isDealer}
                  isHero={s.isHero}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile: vertical stack layout (< 640px) */}
      <div className="sm:hidden">
        <div className="poker-felt relative rounded-2xl border border-emerald-950/80 p-4 shadow-xl shadow-black/60">
          <div className="mb-3 flex items-center justify-center">
            {centerSlot ?? <PotDisplay potBB={potBB} />}
          </div>
          <ul className="grid grid-cols-2 gap-2">
            {seats
              .filter((s) => !s.isHero)
              .map((s) => (
                <li
                  key={s.position}
                  className={cn(s.status === "folded" && "opacity-50")}
                >
                  <Seat
                    position={s.position}
                    status={s.status}
                    stackBB={s.stackBB}
                    lastAction={s.lastAction}
                    isDealer={s.isDealer}
                    isHero={false}
                  />
                </li>
              ))}
          </ul>
          {/* Hero seat at bottom, prominent */}
          <div className="mt-3 flex justify-center">
            {seats
              .filter((s) => s.isHero)
              .map((s) => (
                <Seat
                  key={s.position}
                  position={s.position}
                  status={s.status}
                  stackBB={s.stackBB}
                  lastAction={s.lastAction}
                  isDealer={s.isDealer}
                  isHero
                />
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}
