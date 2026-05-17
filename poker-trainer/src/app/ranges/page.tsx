import Link from "next/link";
import { listRanges } from "@/data";

export default function RangesIndexPage() {
  const ranges = listRanges();
  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-emerald-400 hover:text-emerald-300">
          ← Voltar
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-white">Ranges</h1>
        <p className="mt-1 text-sm text-slate-400">
          Visualizações 13×13 das ranges usadas pelos drills. Cores indicam ação dominante;
          células divididas indicam mix.
        </p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {ranges.map((r) => (
          <li key={r.id}>
            <Link
              href={`/ranges/${r.id}`}
              className="block rounded-lg border border-slate-800 bg-slate-900 p-4 transition-colors hover:border-emerald-500"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold text-white">{r.label}</span>
                <span className="text-xs text-slate-500">{r.effectiveBB} BB</span>
              </div>
              <p className="mt-1 text-sm text-slate-400">{r.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
