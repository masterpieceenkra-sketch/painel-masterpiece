import type { CSSProperties } from "react";
import type { Card as CardType, Suit } from "@/domain/cards";
import { cn } from "@/lib/cn";

const SUIT_NAME_PT: Record<Suit, string> = {
  s: "espadas",
  h: "copas",
  d: "ouros",
  c: "paus",
};

const SUIT_COLOR: Record<Suit, string> = {
  s: "text-slate-900",
  h: "text-rose-600",
  d: "text-rose-600",
  c: "text-slate-900",
};

// SVG suit pip paths — drawn on a 24×24 viewBox, centered.
const SUIT_PATH: Record<Suit, string> = {
  // Spade — leaf with stem.
  s: "M12 2.5c-2.4 3.3-7.5 6.2-7.5 10.2 0 2.4 1.9 4.1 4 4.1 1.3 0 2.4-.6 3-1.6-.2 1.7-.9 3-2.1 4.3h5.2c-1.2-1.3-1.9-2.6-2.1-4.3.6 1 1.7 1.6 3 1.6 2.1 0 4-1.7 4-4.1 0-4-5.1-6.9-7.5-10.2z",
  // Heart — two-lobe.
  h: "M12 20.5c-.4 0-.8-.1-1.1-.4l-6.4-5.7C2.9 13 2 11.3 2 9.5 2 6.5 4.3 4 7.3 4c1.8 0 3.5.9 4.7 2.3C13.2 4.9 14.9 4 16.7 4 19.7 4 22 6.5 22 9.5c0 1.8-.9 3.5-2.5 4.9l-6.4 5.7c-.3.3-.7.4-1.1.4z",
  // Diamond — rhombus.
  d: "M12 2l8 10-8 10L4 12z",
  // Club — three lobes with stem.
  c: "M12 2.5c-2.2 0-4 1.8-4 4 0 .8.2 1.5.6 2.1-.5-.2-1-.3-1.6-.3-2.2 0-4 1.8-4 4s1.8 4 4 4c1.1 0 2.1-.4 2.8-1.1-.1 1.7-.8 3.1-2 4.3h8.4c-1.2-1.2-1.9-2.6-2-4.3.7.7 1.7 1.1 2.8 1.1 2.2 0 4-1.8 4-4s-1.8-4-4-4c-.6 0-1.1.1-1.6.3.4-.6.6-1.3.6-2.1 0-2.2-1.8-4-4-4z",
};

function SuitIcon({ suit, className }: { suit: Suit; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={cn("fill-current", className)}
    >
      <path d={SUIT_PATH[suit]} />
    </svg>
  );
}

const SIZES = {
  sm: {
    card: "h-12 w-9",
    rank: "text-[10px]",
    pip: "h-2 w-2",
    center: "h-3 w-3",
    padding: "p-0.5",
  },
  md: {
    card: "h-20 w-14",
    rank: "text-base",
    pip: "h-3 w-3",
    center: "h-5 w-5",
    padding: "p-1",
  },
  lg: {
    card: "h-28 w-20",
    rank: "text-xl",
    pip: "h-4 w-4",
    center: "h-7 w-7",
    padding: "p-1.5",
  },
} as const;

type Size = keyof typeof SIZES;

export function Card({
  card,
  size = "md",
  className,
  style,
}: {
  card: CardType | "back";
  size?: Size;
  className?: string;
  style?: CSSProperties;
}) {
  const sz = SIZES[size];

  if (card === "back") {
    return (
      <div
        aria-label="carta virada"
        role="img"
        className={cn(
          "card-tilt relative overflow-hidden rounded-md border border-amber-500/40 shadow-md ring-1 ring-inset ring-amber-300/20",
          sz.card,
          className,
        )}
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0 2px, transparent 2px 6px), repeating-linear-gradient(-45deg, rgba(0,0,0,0.18) 0 2px, transparent 2px 6px), linear-gradient(135deg, #047857 0%, #065f46 50%, #064e3b 100%)",
          ...style,
        }}
      />
    );
  }

  const suitNamePt = SUIT_NAME_PT[card.suit];

  return (
    <div
      aria-label={`${card.rank} de ${suitNamePt}`}
      role="img"
      className={cn(
        "card-tilt relative flex flex-col justify-between rounded-md border border-slate-300 bg-white shadow-md",
        SUIT_COLOR[card.suit],
        sz.card,
        sz.padding,
        className,
      )}
      style={style}
    >
      {/* Top-left index — z-10 so the center pip never overlaps it */}
      <div className="z-10 flex flex-col items-center leading-none">
        <span className={cn("font-bold tabular-nums", sz.rank)}>{card.rank}</span>
        <SuitIcon suit={card.suit} className={sz.pip} />
      </div>
      {/* Center pip (decorative) — sits behind the corner indices */}
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
        <SuitIcon suit={card.suit} className={cn("opacity-90", sz.center)} />
      </div>
      {/* Bottom-right index — rotated 180deg, z-10 keeps it above center pip */}
      <div className="z-10 flex rotate-180 flex-col items-center self-end leading-none">
        <span className={cn("font-bold tabular-nums", sz.rank)}>{card.rank}</span>
        <SuitIcon suit={card.suit} className={sz.pip} />
      </div>
    </div>
  );
}
