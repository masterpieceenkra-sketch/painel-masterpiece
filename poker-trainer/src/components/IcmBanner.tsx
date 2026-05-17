import type { IcmScenario } from "@/domain/spots";
import { icmEquity } from "@/engine/icm";
import { cn } from "@/lib/cn";

const STAGE_TONE: Record<IcmScenario["stage"], { bg: string; border: string; text: string; label: string }> = {
  chipEV: { bg: "bg-slate-900/40", border: "border-slate-700", text: "text-slate-300", label: "chipEV" },
  bubble: {
    bg: "bg-amber-950/40",
    border: "border-amber-700",
    text: "text-amber-200",
    label: "Bolha",
  },
  finalTable: {
    bg: "bg-rose-950/40",
    border: "border-rose-800",
    text: "text-rose-200",
    label: "Final Table",
  },
};

export function IcmBanner({ scenario }: { scenario: IcmScenario }) {
  const tone = STAGE_TONE[scenario.stage];
  const stacks = scenario.stacks.map((s) => s.stackBB);
  const equity = icmEquity(stacks, scenario.payoutsPct);
  const totalPct = scenario.payoutsPct.reduce((a, b) => a + b, 0);
  const heroIdx = scenario.stacks.findIndex((s) => s.isHero);
  return (
    <div className={cn("rounded-lg border p-4", tone.bg, tone.border)}>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h3 className={cn("text-sm font-semibold uppercase tracking-wide", tone.text)}>
          {tone.label} · {scenario.label}
        </h3>
        <span className="text-xs text-slate-400">Pool premiação: {totalPct}%</span>
      </div>
      <p className="mb-3 text-sm text-slate-300">{scenario.description}</p>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-slate-500">
            <tr>
              <th className="px-2 py-1 text-left font-normal">Jogador</th>
              <th className="px-2 py-1 text-right font-normal">Stack</th>
              <th className="px-2 py-1 text-right font-normal">Equity ICM</th>
            </tr>
          </thead>
          <tbody>
            {scenario.stacks.map((s, i) => (
              <tr
                key={i}
                className={cn(
                  "border-t border-slate-800",
                  i === heroIdx && "bg-emerald-900/20",
                )}
              >
                <td className="px-2 py-1 text-slate-200">
                  {s.label}
                  {s.isHero && <span className="ml-1 text-emerald-400">★</span>}
                </td>
                <td className="px-2 py-1 text-right font-mono text-slate-300">{s.stackBB} BB</td>
                <td className="px-2 py-1 text-right font-mono text-slate-300">
                  {equity[i].toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {heroIdx >= 0 && (
        <p className="mt-3 text-xs text-slate-400">
          Sua equity ICM atual:{" "}
          <span className="font-mono font-semibold text-white">
            {equity[heroIdx].toFixed(2)}%
          </span>{" "}
          do pool. Bustar zera; preservar mantém. Range tighter que chipEV por esse motivo.
        </p>
      )}
    </div>
  );
}
