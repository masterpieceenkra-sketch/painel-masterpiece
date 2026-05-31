import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostflopSpots, getRange, getSpot, getTopic } from "@/data";
import { SessionView } from "./SessionView";

export default async function SessaoPage({
  params,
}: {
  params: Promise<{ topicSlug: string }>;
}) {
  const { topicSlug } = await params;
  const topic = getTopic(topicSlug);
  if (!topic) notFound();

  const header = (
    <div>
      <Link
        href={`/treino/${topic.slug}`}
        className="text-sm text-emerald-400 hover:text-emerald-300"
      >
        ← Modo livre
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-white">{topic.title}</h1>
      <p className="mt-1 text-sm text-slate-400">
        Sessão guiada — 10 mãos, depois resumo com seus piores erros.
      </p>
    </div>
  );

  if (topic.drillType === "postflop") {
    const spots = getPostflopSpots(topic.id);
    if (!spots || spots.length === 0) notFound();
    return (
      <div className="space-y-6">
        {header}
        <SessionView
          kind="postflop"
          topicId={topic.id}
          topicTitle={topic.title}
          topicSlug={topic.slug}
          targetAttempts={topic.targetAttempts}
          spots={spots}
        />
      </div>
    );
  }

  const spot = getSpot(topic.spotIds[0]);
  if (!spot) notFound();
  const range = getRange(spot.solutionRangeId);
  if (!range) notFound();

  return (
    <div className="space-y-6">
      {header}
      <SessionView
        kind="preflop"
        topicId={topic.id}
        topicTitle={topic.title}
        topicSlug={topic.slug}
        targetAttempts={topic.targetAttempts}
        spot={spot}
        range={range}
      />
    </div>
  );
}
