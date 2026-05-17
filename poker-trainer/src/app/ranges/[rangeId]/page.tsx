import Link from "next/link";
import { notFound } from "next/navigation";
import { getRange, listRanges } from "@/data";
import { RangeGrid, RangeLegend } from "@/components/RangeGrid";

export function generateStaticParams() {
  return listRanges().map((r) => ({ rangeId: r.id }));
}

export default async function RangePage({
  params,
  searchParams,
}: {
  params: Promise<{ rangeId: string }>;
  searchParams: Promise<{ hand?: string }>;
}) {
  const { rangeId } = await params;
  const { hand } = await searchParams;
  const range = getRange(rangeId);
  if (!range) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-emerald-400 hover:text-emerald-300">
          ← Voltar para tópicos
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-white">{range.label}</h1>
        <p className="mt-1 text-sm text-slate-400">{range.description}</p>
      </div>

      <RangeLegend range={range} />
      <RangeGrid range={range} highlightHand={hand} />

      <div className="rounded border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400">
        <strong className="text-slate-200">Fonte:</strong> {range.sourceNote}
      </div>
    </div>
  );
}
