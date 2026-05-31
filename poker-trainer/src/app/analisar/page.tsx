import Link from "next/link";
import { listRanges, listTopics, SPOTS } from "@/data";
import { AnalyzeView } from "./AnalyzeView";
import type { PostflopSpot } from "@/domain/postflop";
import { getPostflopSpots } from "@/data";

export default function AnalisarPage() {
  const topics = listTopics();
  // Flatten every postflop spot across all postflop topics so the analyzer
  // can do similarity matching across the full library.
  const postflopSpots: PostflopSpot[] = topics
    .filter((t) => t.drillType === "postflop")
    .flatMap((t) => getPostflopSpots(t.id) ?? []);

  // Build rangeId → topic slug map so the analyzer can suggest a topic.
  const topicsByRange: Record<string, string> = {};
  for (const t of topics) {
    for (const spotId of t.spotIds) {
      const spot = SPOTS.find((s) => s.id === spotId);
      if (spot && "solutionRangeId" in spot) {
        topicsByRange[spot.solutionRangeId] = t.slug;
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-emerald-400 hover:text-emerald-300">
          ← Voltar
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-white">Analisar mão</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">
          Insira uma mão real (cash ou MTT). O analisador procura um spot
          pré-resolvido equivalente — quando encontra, usa a solução exata; quando
          não, aplica heurística e marca claramente. Use para revisar jogadas de
          home game ou hands que ficaram em dúvida.
        </p>
      </div>
      <AnalyzeView
        spots={SPOTS}
        ranges={listRanges()}
        postflopSpots={postflopSpots}
        topicsByRange={topicsByRange}
      />
    </div>
  );
}
