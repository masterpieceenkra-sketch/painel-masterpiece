import type { Action } from "@/domain/cards";
import type { PostflopScoreResult } from "@/engine/postflop";
import { BUCKET_STYLES } from "@/lib/bucketStyles";
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
  const headline = result.correct
    ? `✓ Acertou${result.bucket === "perfect" ? "" : " (mix válido, EV ligeiramente abaixo)"}`
    : `✗ Errou — ${style.label}`;
  // Best is the entry with EV = bestEvBB. When two entries tie, only the
  // entry whose reference matches result.bestAction gets the star — avoids
  // multi-star confusion on 50/50 mix spots.
  const isBestEntry = (m: PostflopScoreResult["mix"][number]) =>
    m.action === result.bestAction;
  return (
    <div className={cn("rounded-lg border-2 p-5 shadow-lg", style.border, style.bg)}>
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className={cn("text-lg font-bold", style.text)}>{headline}</h3>
        <span className="text-sm text-slate-400">
          {result.correct
            ? `EV: ${formatBB(result.chosenEvBB)}`
            : `EV perdido: ${formatBB(result.evLossBB)}`}
        </span>
      </div>

      <p className="mb-4 leading-relaxed text-slate-200">{result.explanation_ptBR}</p>

      <div className="mb-4 space-y-2">
        <div className="text-xs uppercase tracking-wide text-slate-400">Solução completa</div>
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              <th className="text-left font-normal">Ação</th>
              <th className="text-right font-normal">Freq</th>
              <th className="text-right font-normal">EV</th>
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
                    "border-t border-slate-800",
                    isChosen && "bg-slate-800/50",
                  )}
                >
                  <td className="py-1 text-slate-200">
                    {m.label}
                    {isChosen && (
                      <span className="ml-2 text-xs text-slate-400">(sua escolha)</span>
                    )}
                    {isBest && (
                      <span className="ml-2 text-xs text-emerald-400">★ melhor</span>
                    )}
                  </td>
                  <td className="py-1 text-right font-mono text-slate-300">
                    {formatFreq(m.freq)}
                  </td>
                  <td
                    className={cn(
                      "py-1 text-right font-mono",
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

      <div className="mb-4 text-xs text-slate-500">{result.sourceNote}</div>

      <button
        type="button"
        onClick={onNext}
        className="w-full rounded-md bg-emerald-600 px-4 py-2 font-semibold text-white shadow transition-colors hover:bg-emerald-500"
      >
        Próxima mão →
      </button>
    </div>
  );
}
