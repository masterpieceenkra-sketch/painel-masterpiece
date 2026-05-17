import Link from "next/link";
import { ACTION_LABEL_PT } from "@/domain/cards";
import type { EvBucket } from "@/domain/progress";
import { formatBB } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { ScoreResult } from "@/engine/scoring";
import { MixBar } from "./MixBar";

const BUCKET_STYLES: Record<EvBucket, { border: string; bg: string; label: string; text: string }> = {
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
  const style = BUCKET_STYLES[result.bucket];
  return (
    <div className={cn("rounded-lg border-2 p-5 shadow-lg", style.border, style.bg)}>
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className={cn("text-lg font-bold", style.text)}>
          {result.correct ? "✓ Acertou" : "✗ Errou"} — {style.label}
        </h3>
        <span className="text-sm text-slate-400">
          {result.correct ? "EV perdido: 0" : `EV perdido (est.): ${formatBB(result.evLossBB)}`}
        </span>
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
          {result.bestRaiseSizeBB != null && ` ${result.bestRaiseSizeBB}BB`}
        </span>
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
