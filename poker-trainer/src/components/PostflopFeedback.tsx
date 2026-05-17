import type { Action } from "@/domain/cards";
import type { EvBucket } from "@/domain/progress";
import { labelForAction, type PostflopScoreResult } from "@/engine/postflop";
import { cn } from "@/lib/cn";
import { formatBB, formatFreq } from "@/lib/format";

const BUCKET_STYLES: Record<
  EvBucket,
  { border: string; bg: string; label: string; text: string }
> = {
  perfect: {
    border: "border-emerald-500",
    bg: "bg-emerald-950",
    label: "Perfeito",
    text: "text-emerald-300",
  },
  minor: {
    border: "border-yellow-500",
    bg: "bg-yellow-950",
    label: "Erro pequeno",
    text: "text-yellow-300",
  },
  medium: {
    border: "border-orange-500",
    bg: "bg-orange-950",
    label: "Erro médio",
    text: "text-orange-300",
  },
  major: {
    border: "border-rose-500",
    bg: "bg-rose-950",
    label: "Erro grande",
    text: "text-rose-300",
  },
};

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
  return (
    <div className={cn("rounded-lg border-2 p-5 shadow-lg", style.border, style.bg)}>
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className={cn("text-lg font-bold", style.text)}>
          {result.correct ? "✓ Acertou" : "✗ Errou"} — {style.label}
        </h3>
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
              const isChosen =
                m.action.kind === chosen.kind &&
                (m.action.kind !== "raise" ||
                  (chosen.kind === "raise" &&
                    Math.abs(m.action.sizeBB - chosen.sizeBB) < 0.1 * potBB + 0.2));
              const isBest = m.action === result.bestAction || m.evBB === result.bestEvBB;
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
