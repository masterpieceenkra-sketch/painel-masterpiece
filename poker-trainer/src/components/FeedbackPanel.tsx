import Link from "next/link";
import { ACTION_LABEL_PT } from "@/domain/cards";
import { BUCKET_STYLES } from "@/lib/bucketStyles";
import { formatBB } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { ScoreResult } from "@/engine/scoring";
import { MixBar } from "./MixBar";

export function FeedbackPanel({
  result,
  rangeId,
  rangeLabel,
  hand,
  onNext,
}: {
  result: ScoreResult;
  rangeId?: string;
  rangeLabel?: string;
  hand?: string;
  onNext: () => void;
}) {
  // Sizing miss tem visual próprio: ação certa, sizing fora — bandeira de
  // "ajuste fino" em vez de "Erro pequeno" genérico.
  const style = result.sizingMiss
    ? {
        border: "border-amber-600",
        bg: "bg-amber-950/70",
        text: "text-amber-200",
        label: "Sizing fora",
      }
    : BUCKET_STYLES[result.bucket];
  const headline = result.sizingMiss
    ? "△ Ação certa, sizing fora"
    : result.correct
      ? `✓ Acertou${result.bucket === "perfect" ? "" : " (mix válido)"}`
      : `✗ Errou — ${style.label}`;
  const evLine = result.correct
    ? "EV perdido: 0"
    : result.sizingMiss
      ? `EV perdido (est.): ${formatBB(result.evLossBB)}`
      : `EV perdido (est.): ${formatBB(result.evLossBB)}`;
  return (
    <div className={cn("rounded-lg border-2 p-5 shadow-lg", style.border, style.bg)}>
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className={cn("text-lg font-bold", style.text)}>{headline}</h3>
        <span className="text-sm text-slate-400">{evLine}</span>
      </div>

      <p className="mb-4 text-slate-200">{result.reasoning}</p>

      <div className="mb-4">
        <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">Mix GTO</div>
        <MixBar mix={result.mix} />
      </div>

      <div className="mb-4 text-sm text-slate-300">
        Ação ótima:{" "}
        <span className="font-semibold text-white">
          {ACTION_LABEL_PT[result.bestAction]}
          {result.bestRaiseSizeBB != null && ` ${result.bestRaiseSizeBB}BB padrão`}
        </span>
        {result.bestAction === "raise" &&
          result.bestRaiseSizeBB != null &&
          result.chosenRaiseSizeBB != null &&
          Math.abs(result.chosenRaiseSizeBB - result.bestRaiseSizeBB) > 0.05 &&
          result.correct && (
            <span className="ml-2 text-xs text-slate-400">
              (seu {result.chosenRaiseSizeBB}BB também é aceito ±0.5BB)
            </span>
          )}
      </div>

      {rangeId && (
        <Link
          href={`/ranges/${rangeId}${hand ? `?hand=${encodeURIComponent(hand)}` : ""}`}
          className="mb-3 inline-block text-sm text-emerald-400 hover:text-emerald-300"
        >
          Ver range completa{rangeLabel ? ` — ${rangeLabel}` : ""} →
        </Link>
      )}

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
