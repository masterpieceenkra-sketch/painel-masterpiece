/**
 * Design tokens for the poker-table visual language.
 *
 * - {@link CHIP_PALETTE} is the canonical mapping from a chip face value
 *   to its color name (classic poker chip convention).
 * - {@link chipsFor} breaks a big-blind amount into a visual stack of
 *   colored chips for rendering (greedy on a BB-friendly denomination
 *   ladder).
 * - {@link TYPE_SCALE} centralizes typography utility-class strings.
 *
 * All consumers should import from this file rather than hard-coding
 * colors or denominations so the visual system stays consistent.
 */

/** Chip color name — matches the CSS custom properties in globals.css. */
export type ChipColor =
  | "white"
  | "red"
  | "green"
  | "black"
  | "gold"
  | "blue";

/**
 * Canonical chip face value → color name.
 * Mirrors the classic poker chip convention used in cash games.
 *
 * Frozen so the mapping cannot be mutated at runtime.
 */
export const CHIP_PALETTE = Object.freeze({
  1: "white",
  5: "red",
  25: "green",
  100: "black",
  500: "gold",
} as const) satisfies Record<number, ChipColor>;

export type ChipDenomination = keyof typeof CHIP_PALETTE;

/**
 * Denomination ladder used by {@link chipsFor} to break a BB amount
 * into a visual stack. Values are in big blinds (BB), highest first
 * for greedy decomposition.
 *
 * Each entry pairs a BB value with a color from {@link CHIP_PALETTE}.
 * The ladder uses 50/10/5/1/0.5 BB denominations, which produces
 * compact stacks for typical MTT effective stacks (8–80 BB).
 *
 * Example: 12.5 BB → 1×black(10) + 2×green(1) + 1×white(0.5).
 */
const BB_CHIP_LADDER: ReadonlyArray<{ bb: number; color: ChipColor }> = [
  { bb: 50, color: "gold" },
  { bb: 10, color: "black" },
  { bb: 5, color: "red" },
  { bb: 1, color: "green" },
  { bb: 0.5, color: "white" },
];

/** A single visual chip stack layer: N chips of one color/value. */
export interface ChipStackLayer {
  /** BB value represented by each chip in this layer. */
  value: number;
  /** Color token name (resolve via the `--chip-*` CSS variables). */
  color: ChipColor;
  /** Number of chips to render in this layer. */
  count: number;
}

/** Floating-point tolerance for BB decomposition (≈ a tenth of a cent). */
const EPS = 1e-6;

/**
 * Decompose a big-blind amount into a stack of colored chips.
 *
 * Greedy descent over {@link BB_CHIP_LADDER}. Negative or non-finite
 * inputs return an empty stack. Tiny remainders (< EPS) are ignored
 * to avoid spurious sub-cent chips from float drift.
 *
 * @example
 *   chipsFor(12.5)
 *   // → [
 *   //     { value: 10,  color: "black", count: 1 },
 *   //     { value: 1,   color: "green", count: 2 },
 *   //     { value: 0.5, color: "white", count: 1 },
 *   //   ]
 */
export function chipsFor(bb: number): ChipStackLayer[] {
  if (!Number.isFinite(bb) || bb <= 0) return [];
  const stack: ChipStackLayer[] = [];
  let remaining = bb;
  for (const { bb: value, color } of BB_CHIP_LADDER) {
    if (remaining < value - EPS) continue;
    const count = Math.floor(remaining / value + EPS);
    if (count > 0) {
      stack.push({ value, color, count });
      remaining -= count * value;
    }
  }
  return stack;
}

/**
 * Typography scale — utility-class strings to apply consistent text
 * sizing/weight across the app. Compose with `clsx`/`cn` rather than
 * inlining font sizes.
 */
export const TYPE_SCALE = Object.freeze({
  display: "text-4xl font-bold tracking-tight",
  heading: "text-2xl font-semibold",
  body: "text-base",
  mono: "font-mono text-sm tabular-nums",
} as const);

export type TypeScaleToken = keyof typeof TYPE_SCALE;
