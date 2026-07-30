import Link from "next/link";
import { ACTION_LABEL_PT } from "@/domain/cards";
import { BUCKET_STYLES, ChipPile, SIZING_MISS_STYLE } from "@/lib/bucketStyles";
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
  const style = result.sizingMiss ? SIZING_MISS_STYLE : BUCKET_STYLES[result.bucket];
  const Icon = style.icon;
  const headline = result.sizingMiss
    ? "Ação certa, sizing fora"
    : result.correct
      ? `Acertou${result.bucket === "perfect" ? "" : " (mix válido)"}`
      : `Errou — ${style.label}`;
  const evLine = result.correct
    ? "EV perdido: 0"
    : `EV perdido (est.): ${formatBB(result.evLossBB)}`;

  // Chip animation: grow on correct, fade on wrong, amber on sizing miss.
  const chipState = result.sizingMiss ? "sizing" : result.correct ? "correct" : "wrong";
  const chipColor =
    chipState === "correct"
      ? "text-emerald-400"
      : chipState === "sizing"
        ? "text-amber-400"
        : "text-rose-400";
  const chipAnimClass =
    chipState === "correct" || chipState === "sizing" ? "fp-chip-grow" : "fp-chip-fade";

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
          <span className="text-right text-xs text-slate-400 sm:text-sm">{evLine}</span>
        </div>
      </div>

      <p className="mb-4 text-base leading-relaxed text-slate-200">{result.reasoning}</p>

      <div className="mb-4">
        <div className="mb-1.5 text-xs uppercase tracking-wide text-slate-400">Mix GTO</div>
        <MixBar mix={result.mix} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-md bg-slate-900/60 px-3 py-2 ring-1 ring-slate-800">
        <span className="text-xs uppercase tracking-wide text-slate-400">Ação ótima</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-semibold text-emerald-300 ring-1 ring-inset ring-emerald-500/40">
          {ACTION_LABEL_PT[result.bestAction]}
          {result.bestRaiseSizeBB != null && (
            <span className="font-mono text-emerald-200">{` ${result.bestRaiseSizeBB}BB`}</span>
          )}
        </span>
        {result.bestAction === "raise" &&
          result.bestRaiseSizeBB != null &&
          result.chosenRaiseSizeBB != null &&
          Math.abs(result.chosenRaiseSizeBB - result.bestRaiseSizeBB) > 0.05 &&
          result.correct && (
            <span className="text-xs text-slate-400">
              (seu {result.chosenRaiseSizeBB}BB também é aceito ±0.5BB)
            </span>
          )}
      </div>

      {rangeId && (
        <Link
          href={`/ranges/${rangeId}${hand ? `?hand=${encodeURIComponent(hand)}` : ""}`}
          className="mb-3 inline-block rounded text-sm text-emerald-400 hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          Ver range completa{rangeLabel ? ` — ${rangeLabel}` : ""} →
        </Link>
      )}

      <button
        type="button"
        onClick={onNext}
        className="group inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-3 text-base font-semibold text-white shadow transition-colors hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
      >
        Próxima mão
        <span aria-hidden="true" className="fp-arrow inline-block">→</span>
      </button>
    </div>
  );
}

// Local keyframes — kept here until shared design tokens land in globals.css.
const KEYFRAMES = `
@keyframes fp-chip-grow {
  0% { transform: scale(0.4); opacity: 0; }
  60% { transform: scale(1.08); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes fp-chip-fade {
  0% { transform: scale(1); opacity: 0.9; }
  100% { transform: scale(0.85); opacity: 0; }
}
@keyframes fp-arrow-nudge {
  from { transform: translateX(0); }
  to { transform: translateX(4px); }
}
.fp-chip-grow {
  animation: fp-chip-grow 360ms cubic-bezier(0.2, 0.9, 0.3, 1.2) both;
}
.fp-chip-fade {
  animation: fp-chip-fade 360ms ease-out both;
}
.fp-arrow {
  animation: fp-arrow-nudge 800ms ease-in-out infinite alternate;
}
@media (prefers-reduced-motion: reduce) {
  .fp-arrow,
  .fp-chip-grow,
  .fp-chip-fade { animation: none; }
}
`;
