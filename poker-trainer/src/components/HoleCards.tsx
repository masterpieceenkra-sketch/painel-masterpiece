import type { Card as CardType } from "@/domain/cards";
import { Card } from "./Card";

export function HoleCards({ cards }: { cards: [CardType, CardType] }) {
  return (
    <div className="flex gap-2">
      <Card card={cards[0]} size="lg" />
      <Card card={cards[1]} size="lg" />
    </div>
  );
}
