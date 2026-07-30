import type { PostflopSpot } from "@/domain/postflop";
import { getPostflopSpots, listRanges, listTopics } from "@/data";
import { PlayView } from "./PlayView";

export default function JogarPage() {
  // O bot recebe a biblioteca completa: ranges compiladas para o pré-flop e
  // todos os spots resolvidos para citar quando a textura casa.
  const postflopSpots: PostflopSpot[] = listTopics()
    .filter((t) => t.drillType === "postflop")
    .flatMap((t) => getPostflopSpots(t.id) ?? []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Jogar contra o bot</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">
          Heads-up contra um bot GTO: pré-flop ele joga as ranges Nash reais da
          biblioteca; pós-flop calcula equity por Monte Carlo contra a sua range
          estimada e decide por pot odds, texture e semi-bluffs. No modo coach
          ele explica cada decisão.
        </p>
      </div>
      <PlayView ranges={listRanges()} postflopSpots={postflopSpots} />
    </div>
  );
}
