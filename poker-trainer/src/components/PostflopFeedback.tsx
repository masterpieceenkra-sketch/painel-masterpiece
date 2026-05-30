import type { Action } from "@/domain/cards";
import type { PostflopScoreResult } from "@/engine/postflop";
import { BUCKET_STYLES, ChipPile } from "@/lib/bucketStyles";
import { cn } from "@/lib/cn";
import { formatBB, formatFreq } from "@/lib/format";

function chosenSizeMatches(
  entryAction: Action,
  chosen: Action,
  potBB: number,
): boolean {
  if (entryAction.kind !== chosen.kind) return false;
  if (entryAction.kind === "raise" && chosen.kind === "raise") {
    return Math.abs(entryAction.sizeBB - chosen.sizeBB) / Math.max(potBB, 1) < 0.13;
  }
  return true;
}

export function PostflopFeedback({
  result,
  chosen,
  potBB,
  onNext,
}: {
  result: PostflopScoreResult;
  chosen: Action;
  potBB: number;
  onNext: () => void;
}) {
  const style = BUCKET_STYLES[result.bucket];
  const Icon = style.icon;
  const headline = result.correct
    ? `Acertou${result.bucket === "perfect" ? "" : " (mix válido, EV ligeiramente abaixo)"}`
    : `Errou — ${style.label}`;
  // Best is the entry with EV = bestEvBB. When two entries tie, only the
  // entry whose reference matches result.bestAction gets the star — avoids
  // multi-star confusion on 50/50 mix spots.
  const isBestEntry = (m: PostflopScoreResult["mix"][number]) =>
    m.action === result.bestAction;

  const chipColor = result.correct ? "text-emerald-400" : "text-rose-400";
  const chipAnimClass = result.correct ? "pf-chip-grow" : "pf-chip-fade";

  return (
    <div className={cn("rounded-lg border-2 p-5 shadow-lg", style.border, style.bg)}>
      <style>{KEYFRAMES}</style>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Icon className={cn("h-9 w-9 shrink-0", style.text)} />
          <h3 className={cn("text-2xl font-bold leading-tight", style.text)}>
            {headline}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn("h-10 w-10 shrink-0", chipColor, chipAnimClass)}>
            <ChipPile className="h-full w-full" />
          </span>
          <span className="text-right text-xs text-slate-400 sm:text-sm">
            {result.correct
              ? `EV: ${formatBB(result.chosenEvBB)}`
              : `EV perdido: ${formatBB(result.evLossBB)}`}
          </span>
        </div>
      </div>

      {/* prose-invert-ish block — mimic typography without the plugin */}
      <div className="mb-4 text-base leading-relaxed text-slate-200 [&_strong]:font-semibold [&_strong]:text-white [&_em]:italic [&_em]:text-slate-100">
        <p>{result.explanation_ptBR}</p>
      </div>

      <div className="mb-4 space-y-2">
        <div className="text-xs uppercase tracking-wide text-slate-400">Solução completa</div>
        <div className="overflow-hidden rounded-md ring-1 ring-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/40 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left font-normal">Ação</th>
                <th className="px-3 py-2 text-right font-normal">Freq</th>
                <th className="px-3 py-2 text-right font-normal">EV</th>
              </tr>
            </thead>
            <tbody>
              {result.mix.map((m, i) => {
                const isChosen = chosenSizeMatches(m.action, chosen, potBB);
                const isBest = isBestEntry(m);
                return (
                  <tr
                    key={i}
                    className={cn(
                      "border-t border-slate-800 transition-colors hover:bg-slate-800/40",
                      isChosen && "bg-slate-800/60",
                      isBest && "border-l-2 border-l-emerald-500/70",
                    )}
                  >
                    <td className="px-3 py-1.5 text-slate-200">
                      <span className="inline-flex flex-wrap items-center gap-2">
                        <span>{m.label}</span>
                        {isChosen && (
                          <span className="inline-flex items-center rounded-full bg-slate-700/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-300">
                            sua escolha
                          </span>
                        )}
                        {isBest && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300 ring-1 ring-inset ring-emerald-500/40">
                            <span aria-hidden="true">★</span> melhor
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono text-slate-300">
                      {formatFreq(m.freq)}
                    </td>
                    <td
                      className={cn(
                        "px-3 py-1.5 text-right font-mono",
                        m.evBB >= 0 ? "text-slate-300" : "text-rose-300",
                      )}
                    >
                      {m.evBB >= 0 ? "+" : ""}
                      {formatBB(m.evBB)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-4 text-xs text-slate-500">{result.sourceNote}</div>

      <button
        type="button"
        onClick={onNext}
        className="group inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-3 text-base font-semibold text-white shadow transition-colors hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
      >
        Próxima mão
        <span aria-hidden="true" className="pf-arrow inline-block">→</span>
      </button>
    </div>
  );
}

const KEYFRAMES = `
@keyframes pf-chip-grow {
  0% { transform: scale(0.4); opacity: 0; }
  60% { transform: scale(1.08); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes pf-chip-fade {
  0% { transform: scale(1); opacity: 0.9; }
  100% { transform: scale(0.85); opacity: 0; }
}
@keyframes pf-arrow-nudge {
  from { transform: translateX(0); }
  to { transform: translateX(4px); }
}
.pf-chip-grow {
  animation: pf-chip-grow 360ms cubic-bezier(0.2, 0.9, 0.3, 1.2) both;
}
.pf-chip-fade {
  animation: pf-chip-fade 360ms ease-out both;
}
.pf-arrow {
  animation: pf-arrow-nudge 800ms ease-in-out infinite alternate;
}
@media (prefers-reduced-motion: reduce) {
  .pf-arrow,
  .pf-chip-grow,
  .pf-chip-fade { animation: none; }
}
`;
