import { cn } from "@/lib/cn";

type Size = "sm" | "md";

const SIZE = {
  sm: {
    chipW: "w-6",
    chipH: "h-1.5",
    label: "text-[10px]",
    gap: "-mt-1",
  },
  md: {
    chipW: "w-8",
    chipH: "h-2",
    label: "text-xs",
    gap: "-mt-1.5",
  },
} as const;

/**
 * Picks chip layer colors based on stack depth. Approximates a casino chip
 * value ladder: shallow stacks → red/orange; medium → amber/gold; deep → emerald.
 */
function chipColors(stackBB: number): string[] {
  if (stackBB <= 10) {
    return [
      "from-rose-400 to-rose-600",
      "from-rose-500 to-rose-700",
      "from-rose-600 to-rose-800",
    ];
  }
  if (stackBB <= 25) {
    return [
      "from-amber-300 to-amber-500",
      "from-amber-400 to-amber-600",
      "from-amber-500 to-amber-700",
      "from-amber-600 to-amber-800",
    ];
  }
  return [
    "from-emerald-300 to-emerald-500",
    "from-emerald-400 to-emerald-600",
    "from-emerald-500 to-emerald-700",
    "from-emerald-600 to-emerald-800",
    "from-emerald-700 to-emerald-900",
  ];
}

export function ChipStack({
  stackBB,
  size = "sm",
  ariaHidden = false,
}: {
  stackBB: number;
  size?: Size;
  ariaHidden?: boolean;
}) {
  const layers = chipColors(stackBB);
  const dims = SIZE[size];
  return (
    <div
      className="flex flex-col items-center"
      aria-hidden={ariaHidden || undefined}
    >
      <div className="flex flex-col items-center">
        {layers.map((c, i) => (
          <div
            key={i}
            className={cn(
              "rounded-full border border-black/30 bg-gradient-to-b shadow-sm",
              c,
              dims.chipW,
              dims.chipH,
              i > 0 && dims.gap,
            )}
          />
        ))}
      </div>
      <span
        className={cn(
          "mt-1 font-mono tabular-nums text-slate-100",
          dims.label,
        )}
      >
        {stackBB} BB
      </span>
    </div>
  );
}
