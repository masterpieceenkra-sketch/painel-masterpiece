import { notFound } from "next/navigation";
import Link from "next/link";
import { getRange, getSpot, getTopic } from "@/data";
import { DrillRunner } from "./DrillRunner";

export default async function TreinoPage({
  params,
}: {
  params: Promise<{ topicSlug: string }>;
}) {
  const { topicSlug } = await params;
  const topic = getTopic(topicSlug);
  if (!topic) notFound();

  const spotId = topic.spotIds[0];
  const spot = getSpot(spotId);
  if (!spot || spot.kind === "open" || spot.kind === "defense") {
    if (!spot) notFound();
  }
  if (!spot) notFound();

  const range = spot.kind === "pushfold" || spot.kind === "open" || spot.kind === "defense"
    ? getRange(spot.solutionRangeId)
    : undefined;
  if (!range) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-emerald-400 hover:text-emerald-300">
          ← Voltar para tópicos
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-white">{topic.title}</h1>
        <p className="mt-1 text-sm text-slate-400">{topic.description}</p>
      </div>

      <DrillRunner topicId={topic.id} spot={spot} range={range} targetAttempts={topic.targetAttempts} />
    </div>
  );
}
