import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostflopSpots, getRange, getSpot, getTopic } from "@/data";
import { DrillRunner } from "./DrillRunner";
import { PostflopRunner } from "./PostflopRunner";

export default async function TreinoPage({
  params,
}: {
  params: Promise<{ topicSlug: string }>;
}) {
  const { topicSlug } = await params;
  const topic = getTopic(topicSlug);
  if (!topic) notFound();

  const header = (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <Link href="/" className="text-sm text-emerald-400 hover:text-emerald-300">
          ← Voltar para tópicos
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-white">{topic.title}</h1>
        <p className="mt-1 text-sm text-slate-400">{topic.description}</p>
      </div>
      <Link
        href={`/sessao/${topic.slug}`}
        className="mt-6 inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-500"
      >
        <span aria-hidden="true">⏱</span> Sessão de 10 mãos
      </Link>
    </div>
  );

  if (topic.drillType === "postflop") {
    const spots = getPostflopSpots(topic.id);
    if (!spots || spots.length === 0) notFound();
    return (
      <div className="space-y-6">
        {header}
        <PostflopRunner topicId={topic.id} spots={spots} targetAttempts={topic.targetAttempts} />
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
      <DrillRunner
        topicId={topic.id}
        spot={spot}
        range={range}
        targetAttempts={topic.targetAttempts}
      />
    </div>
  );
}
