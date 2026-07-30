import { ACTION_LABEL_PT, type ActionKind, type HandCode } from "@/domain/cards";
import { getMix, type PreflopRange } from "@/domain/range";
import { cn } from "@/lib/cn";
import { formatFreq, formatPct } from "@/lib/format";

const GRID_RANKS = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"] as const;

// Palette aligned with the app's semantic colors: emerald=call/check,
// amber=raise, rose=jam, slate=fold. Keep in sync with the Tailwind config.
const ACTION_COLOR: Record<ActionKind, string> = {
  fold: "bg-slate-700",
  call: "bg-emerald-600",
  check: "bg-emerald-600",
  raise: "bg-amber-500",
  jam: "bg-rose-600",
};

// One-letter scannable glyph per action — eliminates the need to consult the
// legend on dense grids. "J" = jam, "R" = raise, "C" = call/check, "·" = fold.
const ACTION_GLYPH: Record<ActionKind, string> = {
  fold: "·",
  call: "C",
  check: "C",
  raise: "R",
  jam: "J",
};

const ACTION_ORDER: ActionKind[] = ["jam", "raise", "call", "check", "fold"];

function handAt(row: number, col: number): HandCode {
  if (row === col) return `${GRID_RANKS[row]}${GRID_RANKS[col]}`;
  if (row < col) return `${GRID_RANKS[row]}${GRID_RANKS[col]}s`;
  return `${GRID_RANKS[col]}${GRID_RANKS[row]}o`;
}

function dominant(stacks: { kind: ActionKind; freq: number }[]): ActionKind | null {
  if (stacks.length === 0) return null;
  return stacks.reduce((best, s) => (s.freq > best.freq ? s : best), stacks[0]).kind;
}

export type RangeGridSize = "full" | "thumb";

export function RangeGrid({
  range,
  highlightHand,
  className,
  size = "full",
}: {
  range: PreflopRange;
  highlightHand?: HandCode;
  className?: string;
  size?: RangeGridSize;
}) {
  // Reduced thumbnail variant for list cards: just the colored stacks, no
  // labels, no hover, no tap targets. The parent <Link> handles interaction.
  if (size === "thumb") {
    return (
      <div
        className={cn(
          "grid w-full gap-px rounded border border-slate-800 bg-slate-800 p-px",
          className,
        )}
        style={{ gridTemplateColumns: "repeat(13, minmax(0, 1fr))" }}
        aria-hidden
      >
        {GRID_RANKS.map((_, row) =>
          GRID_RANKS.map((__, col) => {
            const hand = handAt(row, col);
            const mix = getMix(range, hand);
            const stacks = ACTION_ORDER.filter((k) => (mix[k] ?? 0) > 0).map((k) => ({
              kind: k,
              freq: mix[k] ?? 0,
            }));
            return (
              <div key={hand} className="relative aspect-square overflow-hidden">
                <div className="absolute inset-0 flex flex-col">
                  {stacks.map((s) => (
                    <div
                      key={s.kind}
                      className={ACTION_COLOR[s.kind]}
                      style={{ height: `${s.freq * 100}%` }}
                    />
                  ))}
                </div>
              </div>
            );
          }),
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        // Slightly larger gap than `gap-px` for breathing room. tabular-nums
        // keeps mono codes (J, R, %) aligned across cells.
        "inline-grid w-full max-w-3xl gap-[2px] rounded border border-slate-800 bg-slate-800 p-[2px] tabular-nums",
        className,
      )}
      style={{ gridTemplateColumns: "repeat(13, minmax(0, 1fr))" }}
    >
      {GRID_RANKS.map((_, row) =>
        GRID_RANKS.map((__, col) => {
          const hand = handAt(row, col);
          const mix = getMix(range, hand);
          const stacks = ACTION_ORDER.filter((k) => (mix[k] ?? 0) > 0).map((k) => ({
            kind: k,
            freq: mix[k] ?? 0,
          }));
          const highlighted = highlightHand === hand;
          const dom = dominant(stacks);
          const titleText = stacks
            .map((s) => `${ACTION_LABEL_PT[s.kind]} ${formatFreq(s.freq)}`)
            .join(" · ");
          // Determine if this cell is in the right half of the grid — for
          // those cells, anchor the popover to the right so it doesn't
          // extend past the grid edge (which is inside an overflow-x-auto
          // wrapper on the detail page and would otherwise be clipped).
          const popoverAlignRight = col >= GRID_RANKS.length - 3;
          // Same for bottom rows — flip the popover above the cell so it
          // doesn't fall outside the visible area on the last rows.
          const popoverAlignAbove = row >= GRID_RANKS.length - 2;
          return (
            <div
              key={hand}
              // `group` enables CSS-only hover + focus popover. tabIndex={-1}
              // makes the cell programmatically focusable (so a touch tap can
              // trigger :focus and show the popover) WITHOUT polluting the
              // keyboard tab order — 169 tab stops would be unusable.
              tabIndex={-1}
              aria-label={`${hand} — ${titleText}`}
              className={cn(
                "group relative flex aspect-square items-center justify-center font-mono text-[10px] font-semibold text-white shadow-inner outline-none sm:text-xs",
                highlighted &&
                  "z-10 ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-900",
              )}
            >
              {/* Colored stack — clipped inside the cell so the popover above
                  can overflow past the grid border. */}
              <div className="absolute inset-0 flex flex-col overflow-hidden">
                {stacks.map((s) => (
                  <div
                    key={s.kind}
                    className={ACTION_COLOR[s.kind]}
                    style={{ height: `${s.freq * 100}%` }}
                  />
                ))}
              </div>

              {/* Hand code + dominant-action glyph. Glyph only on sm+ — at 360px
                  the cells are too small to fit both legibly. */}
              <span className="relative z-[1] inline-flex items-center gap-0.5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.85)]">
                <span>{hand}</span>
                {dom && (
                  <span
                    aria-hidden
                    className="hidden text-[8px] opacity-80 sm:inline"
                  >
                    {ACTION_GLYPH[dom]}
                  </span>
                )}
              </span>

              {/* "Sua mão" badge — only on the highlighted cell. pointer-events
                  disabled so it doesn't steal hover from neighboring cells. */}
              {highlighted && (
                <span
                  role="status"
                  className="pointer-events-none absolute -top-2 left-1/2 z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded bg-amber-400 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-950 shadow-md"
                >
                  Sua mão
                </span>
              )}

              {/* Hover/focus popover — CSS-only. Shows mix breakdown + a swatch
                  of the dominant action. Hidden by default; visible on
                  group-hover (mouse) or group-focus (touch tap, since
                  tabIndex={-1} on the cell makes it focusable). Position
                  flips at the grid edges so the popover never gets clipped
                  by the page's overflow-x-auto wrapper. */}
              <div
                role="tooltip"
                className={cn(
                  "pointer-events-none absolute z-20 hidden min-w-[140px] rounded-md border border-slate-700 bg-slate-950/95 px-2 py-1.5 text-left text-[11px] font-normal text-slate-100 shadow-xl",
                  popoverAlignAbove ? "bottom-full mb-1" : "top-full mt-1",
                  popoverAlignRight ? "right-0" : "left-1/2 -translate-x-1/2",
                  "group-hover:block group-focus:block",
                )}
              >
                <div className="flex items-center gap-1.5">
                  {dom && (
                    <span
                      aria-hidden
                      className={cn(
                        "inline-block h-2.5 w-2.5 rounded-sm",
                        ACTION_COLOR[dom],
                      )}
                    />
                  )}
                  <span className="font-mono font-semibold tabular-nums">{hand}</span>
                </div>
                <div className="mt-1 text-slate-300">
                  {stacks.length === 0
                    ? "Sem dados"
                    : stacks
                        .map(
                          (s) => `${ACTION_LABEL_PT[s.kind]} ${formatFreq(s.freq)}`,
                        )
                        .join(" · ")}
                </div>
              </div>
            </div>
          );
        }),
      )}
    </div>
  );
}

export function RangeLegend({ range }: { range: PreflopRange }) {
  const seen = new Set<ActionKind>();
  for (const mix of Object.values(range.cells)) {
    for (const k of Object.keys(mix) as ActionKind[]) {
      if ((mix[k] ?? 0) > 0) seen.add(k);
    }
  }
  for (const k of Object.keys(range.defaultFrequencies) as ActionKind[]) {
    if ((range.defaultFrequencies[k] ?? 0) > 0) seen.add(k);
  }
  const items = ACTION_ORDER.filter((k) => seen.has(k));
  return (
    <div className="flex flex-wrap gap-3 text-xs text-slate-400">
      {items.map((k) => (
        <span key={k} className="inline-flex items-center gap-1.5">
          <span className={cn("inline-block h-3 w-3 rounded-sm", ACTION_COLOR[k])} />
          <span aria-hidden className="font-mono text-[10px] text-slate-300">
            {ACTION_GLYPH[k]}
          </span>
          <span>{ACTION_LABEL_PT[k]}</span>
        </span>
      ))}
    </div>
  );
}

/**
 * Sidebar that summarizes the range: each action with its swatch, glyph,
 * label, and the share of the 169-combo grid doing that action.
 *
 * Share is computed by iterating all 13×13 cells (empty cells fall back to
 * defaultFrequencies, mirroring the grid's rendering) and summing each
 * action's frequency. The denominator is 169 so the result reads as
 * "% of the visualized grid" — consistent with what the user sees on
 * screen. It is NOT a card-combo-weighted breakdown.
 */
export function RangeSummary({
  range,
  highlightHand,
}: {
  range: PreflopRange;
  highlightHand?: HandCode;
}) {
  const totals: Record<ActionKind, number> = {
    fold: 0,
    call: 0,
    check: 0,
    raise: 0,
    jam: 0,
  };
  let totalCells = 0;
  for (let row = 0; row < GRID_RANKS.length; row++) {
    for (let col = 0; col < GRID_RANKS.length; col++) {
      const hand = handAt(row, col);
      const mix = getMix(range, hand);
      for (const k of Object.keys(mix) as ActionKind[]) {
        totals[k] += mix[k] ?? 0;
      }
      totalCells += 1;
    }
  }
  const items = ACTION_ORDER.filter((k) => totals[k] > 0);

  return (
    <aside className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/60 p-4 lg:sticky lg:top-4">
      <div>
        <h2 className="text-sm font-semibold text-white">Resumo da range</h2>
        <p className="mt-1 text-xs text-slate-400">
          Distribuição de ações sobre as 169 combinações.
        </p>
      </div>

      <dl className="space-y-2">
        {items.map((k) => {
          const pct = (totals[k] / totalCells) * 100;
          return (
            <div key={k} className="flex items-center gap-2">
              <span
                aria-hidden
                className={cn(
                  "inline-block h-3.5 w-3.5 shrink-0 rounded-sm",
                  ACTION_COLOR[k],
                )}
              />
              <span
                aria-hidden
                className="w-3 text-center font-mono text-[10px] text-slate-400"
              >
                {ACTION_GLYPH[k]}
              </span>
              <dt className="flex-1 text-sm text-slate-200">{ACTION_LABEL_PT[k]}</dt>
              <dd className="font-mono text-sm font-semibold tabular-nums text-slate-100">
                {`${formatPct(pct, pct < 10 ? 1 : 0)} da range`}
              </dd>
            </div>
          );
        })}
      </dl>

      <div className="space-y-1 border-t border-slate-800 pt-3 text-xs">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-slate-400">Stack efetivo</span>
          <span className="font-mono font-semibold tabular-nums text-white">
            {range.effectiveBB} BB
          </span>
        </div>
        {highlightHand && (
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-slate-400">Sua mão</span>
            <span className="font-mono font-semibold tabular-nums text-amber-400">
              {highlightHand}
            </span>
          </div>
        )}
      </div>

      <p className="border-t border-slate-800 pt-3 text-[11px] leading-relaxed text-slate-500">
        <span className="font-semibold text-slate-400">Fonte:</span> {range.sourceNote}
      </p>
    </aside>
  );
}
