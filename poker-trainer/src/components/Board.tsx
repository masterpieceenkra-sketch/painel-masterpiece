import type { Card as CardType } from "@/domain/cards";
import { Card } from "./Card";

// Progressive deal delays (ms): flop fast 0/60/120, turn at 240, river at 360.
const DEAL_DELAY_MS = [0, 60, 120, 240, 360];

export function Board({ cards }: { cards: CardType[] }) {
  return (
    <div className="flex items-center gap-2">
      {cards.map((c, i) => (
        <Card
          key={`${c.rank}${c.suit}-${i}`}
          card={c}
          size="md"
          className="animate-deal-in"
          style={{ animationDelay: `${DEAL_DELAY_MS[i] ?? 0}ms` }}
        />
      ))}
      {Array.from({ length: Math.max(0, 5 - cards.length) }).map((_, i) => (
        <div
          key={`empty-${i}`}
          className="h-20 w-14 rounded-md border border-dashed border-slate-700/60 bg-slate-900/50"
          aria-hidden
        />
      ))}
    </div>
  );
}
