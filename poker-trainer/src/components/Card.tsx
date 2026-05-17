import type { Card as CardType, Suit } from "@/domain/cards";
import { cn } from "@/lib/cn";

const SUIT_GLYPH: Record<Suit, string> = {
  s: "♠",
  h: "♥",
  d: "♦",
  c: "♣",
};

const SUIT_COLOR: Record<Suit, string> = {
  s: "text-slate-900",
  h: "text-rose-600",
  d: "text-rose-600",
  c: "text-slate-900",
};

const SIZES = {
  sm: "w-10 h-14 text-sm",
  md: "w-16 h-22 text-xl",
  lg: "w-20 h-28 text-2xl",
} as const;

type Size = keyof typeof SIZES;

export function Card({ card, size = "md", className }: { card: CardType | "back"; size?: Size; className?: string }) {
  if (card === "back") {
    return (
      <div
        aria-label="carta virada"
        className={cn(
          "rounded-md border border-emerald-900 bg-gradient-to-br from-emerald-700 to-emerald-900 shadow-inner",
          SIZES[size],
          className,
        )}
      />
    );
  }
  return (
    <div
      aria-label={`${card.rank}${card.suit}`}
      className={cn(
        "flex flex-col items-center justify-between rounded-md border border-slate-200 bg-white px-1.5 py-1 font-semibold shadow",
        SUIT_COLOR[card.suit],
        SIZES[size],
        className,
      )}
    >
      <span className="self-start leading-none">{card.rank}</span>
      <span className="text-2xl leading-none">{SUIT_GLYPH[card.suit]}</span>
      <span className="self-end rotate-180 leading-none">{card.rank}</span>
    </div>
  );
}
