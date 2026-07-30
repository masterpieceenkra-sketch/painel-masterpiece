import Link from "next/link";
import { notFound } from "next/navigation";
import { getRange, listRanges } from "@/data";
import { RangeGrid, RangeLegend, RangeSummary } from "@/components/RangeGrid";

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
        <Link
          href="/ranges"
          className="text-sm text-emerald-400 outline-none hover:text-emerald-300 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          ← Voltar para ranges
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-white">{range.label}</h1>
        <p className="mt-1 text-sm text-slate-400">{range.description}</p>
      </div>

      <RangeLegend range={range} />

      {/* 2-column layout on lg+: grid takes 8/12 cols, sidebar 4/12. Stacks on
          mobile. The grid wrapper keeps the 13×13 usable at 360px via overflow
          scroll and a minimum width — see CONVENTIONS. Top padding leaves
          room for the "Sua mão" badge above highlighted cells. */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="-mx-2 overflow-x-auto px-2 pt-6 pb-2">
            <div className="min-w-[360px]">
              <RangeGrid range={range} highlightHand={hand} />
            </div>
          </div>
        </div>
        <div className="lg:col-span-4">
          <RangeSummary range={range} highlightHand={hand} />
        </div>
      </div>
    </div>
  );
}
