"use client";

import { useMemo } from "react";
import type { IcmScenario } from "@/domain/spots";
import { icmEquity } from "@/engine/icm";
import { cn } from "@/lib/cn";

type Stage = IcmScenario["stage"];

const STAGE_TONE: Record<
  Stage,
  {
    bg: string;
    border: string;
    text: string;
    pennant: string;
    heroSegment: string;
    label: string;
  }
> = {
  chipEV: {
    bg: "bg-slate-900/40",
    border: "border-slate-800",
    text: "text-slate-300",
    pennant: "text-slate-400",
    heroSegment: "bg-emerald-500/70",
    label: "chipEV",
  },
  bubble: {
    // Slightly desaturated amber palette
    bg: "bg-amber-950/30",
    border: "border-amber-900/70",
    text: "text-amber-100",
    pennant: "text-amber-300",
    heroSegment: "bg-emerald-500/80",
    label: "BOLHA",
  },
  finalTable: {
    // Slightly desaturated rose palette
    bg: "bg-rose-950/30",
    border: "border-rose-900/70",
    text: "text-rose-100",
    pennant: "text-rose-300",
    heroSegment: "bg-emerald-500/80",
    label: "FINAL TABLE",
  },
};

function PennantIcon({ className }: { className?: string }) {
  // Simple flag/pennant glyph evoking a tournament marker.
  return (
    <svg
      width="14"
      height="16"
      viewBox="0 0 14 16"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M2 1.5v13"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M2.6 2.2 L12 4 L8 6.5 L12 9 L2.6 10.5 Z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}

export function IcmBanner({ scenario }: { scenario: IcmScenario }) {
  const tone = STAGE_TONE[scenario.stage];
  const heroIdx = scenario.stacks.findIndex((s) => s.isHero);

  const { equity, effectivePoolPct, fullPoolPct, truncated, totalChips } = useMemo(() => {
    const stacks = scenario.stacks.map((s) => s.stackBB);
    const considered = scenario.payoutsPct.slice(0, stacks.length);
    return {
      equity: icmEquity(stacks, scenario.payoutsPct),
      effectivePoolPct: considered.reduce((a, b) => a + b, 0),
      fullPoolPct: scenario.payoutsPct.reduce((a, b) => a + b, 0),
      truncated: scenario.payoutsPct.length > stacks.length,
      totalChips: stacks.reduce((a, b) => a + b, 0),
    };
  }, [scenario]);

  return (
    <div className={cn("rounded-lg border p-4", tone.bg, tone.border)}>
      {/* Header */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3
          className={cn(
            "flex items-center gap-2 text-sm font-bold uppercase tracking-wider",
            tone.text,
          )}
        >
          <PennantIcon className={tone.pennant} />
          <span>{tone.label}</span>
          <span className="text-slate-500 font-semibold">·</span>
          <span className="font-semibold normal-case tracking-normal text-slate-200">
            {scenario.label}
          </span>
        </h3>
        <span className="text-xs text-slate-400">
          {truncated ? (
            <>
              Equity desta mesa:{" "}
              <span className="text-slate-300">{effectivePoolPct}%</span> do pool{" "}
              <span className="opacity-60">(total {fullPoolPct}%)</span>
            </>
          ) : (
            <>Pool premiação: {effectivePoolPct}%</>
          )}
        </span>
      </div>

      <p className="mb-3 text-sm text-slate-300">{scenario.description}</p>

      {/* Equity bar visualization */}
      {totalChips > 0 && (
        <div className="mb-4">
          <div
            className="flex h-3 w-full overflow-hidden rounded-full border border-slate-800 bg-slate-900"
            role="img"
            aria-label="Distribuição de stacks por cadeira"
          >
            {scenario.stacks.map((s, i) => {
              const widthPct = (s.stackBB / totalChips) * 100;
              const isHero = i === heroIdx;
              return (
                <span
                  key={i}
                  title={`${s.label} · ${s.stackBB} BB`}
                  // min-width keeps tiny stacks visible; flex-shrink lets large
                  // siblings give back the space so the bar still sums to 100%.
                  style={{ width: `${widthPct}%`, minWidth: "4%" }}
                  className={cn(
                    "h-full border-r border-slate-950/40 last:border-r-0 transition-[width] duration-300 motion-reduce:transition-none",
                    isHero
                      ? cn(tone.heroSegment, "shadow-[0_0_8px_rgba(16,185,129,0.5)]")
                      : "bg-slate-700",
                  )}
                />
              );
            })}
          </div>
          <div className="mt-1 flex w-full text-[10px] text-slate-400">
            {scenario.stacks.map((s, i) => {
              const widthPct = (s.stackBB / totalChips) * 100;
              return (
                <span
                  key={i}
                  // Mirror the bar's width logic so labels stay aligned with their segments.
                  style={{ width: `${widthPct}%`, minWidth: "4%" }}
                  className={cn(
                    "truncate px-1 text-center font-mono",
                    i === heroIdx ? "text-emerald-300" : "text-slate-500",
                  )}
                >
                  {s.label} · {s.stackBB}BB
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Per-seat card grid */}
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {scenario.stacks.map((s, i) => {
          const isHero = i === heroIdx;
          return (
            <li
              key={i}
              className={cn(
                "relative rounded-md border px-2.5 py-2 text-xs",
                isHero
                  ? "border-emerald-500/60 bg-emerald-950/30"
                  : "border-slate-800 bg-slate-900/50",
              )}
            >
              <div className="flex items-baseline justify-between gap-1">
                <span
                  className={cn(
                    "font-semibold",
                    isHero ? "text-emerald-200" : "text-slate-200",
                  )}
                >
                  {s.label}
                </span>
                <span className="font-mono text-slate-400">{s.stackBB} BB</span>
              </div>
              <div className="mt-0.5 flex items-center justify-between gap-1">
                <span className="text-[10px] uppercase tracking-wide text-slate-500">
                  Equity
                </span>
                <span
                  className={cn(
                    "font-mono font-semibold",
                    isHero ? "text-emerald-300" : "text-slate-300",
                  )}
                >
                  {equity[i].toFixed(1)}%
                </span>
              </div>
              {isHero && (
                <span
                  className="absolute -top-2 right-2 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-emerald-950 shadow"
                  aria-label="Você"
                >
                  ★ você
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {heroIdx >= 0 && (
        <p className="mt-3 text-xs text-slate-400">
          Sua equity ICM atual:{" "}
          <span className="font-mono font-semibold text-white">
            {equity[heroIdx].toFixed(2)}%
          </span>{" "}
          do pool {truncated && <>(considerando apenas as {scenario.stacks.length} cadeiras desta mesa)</>}. Bustar zera; preservar mantém. Range tighter que chipEV por esse motivo.
        </p>
      )}
    </div>
  );
}
