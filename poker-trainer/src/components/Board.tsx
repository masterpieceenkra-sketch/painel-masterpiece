import type { Card as CardType } from "@/domain/cards";
import { Card } from "./Card";

export function Board({ cards }: { cards: CardType[] }) {
  return (
    <div className="flex items-center gap-2">
      {cards.map((c, i) => (
        <Card key={`${c.rank}${c.suit}-${i}`} card={c} size="md" />
      ))}
      {Array.from({ length: Math.max(0, 5 - cards.length) }).map((_, i) => (
        <div
          key={`empty-${i}`}
          className="h-22 w-16 rounded-md border border-dashed border-slate-700"
          aria-hidden
        />
      ))}
    </div>
  );
}
