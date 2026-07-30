import { formatPct } from "@/lib/format";
import { cn } from "@/lib/cn";

type Tone = "slate" | "emerald" | "amber" | "rose";

function ringTone(attempts: number, correctPct: number): Tone {
  if (attempts === 0) return "slate";
  if (correctPct >= 70) return "emerald";
  if (correctPct >= 40) return "amber";
  return "rose";
}

// Stroke colour for the SVG ring
const RING_STROKE: Record<Tone, string> = {
  slate: "stroke-slate-600",
  emerald: "stroke-emerald-400",
  amber: "stroke-amber-400",
  rose: "stroke-rose-400",
};

const RING_TEXT: Record<Tone, string> = {
  slate: "text-slate-400",
  emerald: "text-emerald-300",
  amber: "text-amber-300",
  rose: "text-rose-300",
};

export type ProgressBadgeProps = {
  attempts: number;
  target: number;
  correctPct: number;
  /** Visual style. `pill` (default) keeps the legacy badge; `ring` renders a circular progress ring. */
  variant?: "pill" | "ring";
  /** Affects the ring diameter. `sm` = 36px, `md` = 44px. Pill ignores this. */
  size?: "sm" | "md";
};

export function ProgressBadge({
  attempts,
  target,
  correctPct,
  variant = "pill",
  size = "sm",
}: ProgressBadgeProps) {
  if (variant === "ring") {
    return (
      <ProgressRing
        attempts={attempts}
        target={target}
        correctPct={correctPct}
        size={size}
      />
    );
  }

  // Pill keeps the original 85/65 thresholds for stylistic continuity.
  const pillTone =
    attempts === 0
      ? "bg-slate-700 text-slate-300"
      : correctPct >= 85
        ? "bg-emerald-700 text-emerald-50"
        : correctPct >= 65
          ? "bg-amber-700 text-amber-50"
          : "bg-rose-700 text-rose-50";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        pillTone,
      )}
    >
      {attempts === 0 ? (
        "Sem tentativas"
      ) : (
        <>
          {formatPct(correctPct)} <span className="opacity-70">·</span> {attempts}/{target}
        </>
      )}
    </span>
  );
}

function ProgressRing({
  attempts,
  target,
  correctPct,
  size,
}: {
  attempts: number;
  target: number;
  correctPct: number;
  size: "sm" | "md";
}) {
  const diameter = size === "md" ? 44 : 36;
  const stroke = 3;
  const radius = (diameter - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = attempts === 0 ? 0 : Math.max(0, Math.min(100, correctPct));
  const dashOffset = circumference * (1 - pct / 100);
  const tone = ringTone(attempts, correctPct);

  const ariaLabel =
    attempts === 0
      ? "Sem tentativas"
      : `Acerto ${formatPct(correctPct)} em ${attempts} de ${target} tentativas`;

  return (
    <span
      role="img"
      aria-label={ariaLabel}
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: diameter, height: diameter }}
    >
      <svg
        width={diameter}
        height={diameter}
        viewBox={`0 0 ${diameter} ${diameter}`}
        className="block -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          className="stroke-slate-800"
          strokeWidth={stroke}
          fill="none"
        />
        {attempts > 0 && (
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            className={cn(
              RING_STROKE[tone],
              "transition-[stroke-dashoffset] duration-500 motion-reduce:transition-none",
            )}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            fill="none"
          />
        )}
      </svg>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center font-mono font-semibold tabular-nums",
          size === "md" ? "text-[10px]" : "text-[9px]",
          RING_TEXT[tone],
        )}
      >
        {attempts === 0 ? "—" : `${Math.round(correctPct)}`}
      </span>
    </span>
  );
}
