"use client";

export function SizingSlider({
  minBB,
  maxBB,
  stepBB = 0.1,
  valueBB,
  onChange,
  label = "Sizing",
}: {
  minBB: number;
  maxBB: number;
  stepBB?: number;
  valueBB: number;
  onChange: (bb: number) => void;
  label?: string;
}) {
  const stepInt = Math.round(stepBB * 10);
  return (
    <div className="flex items-center gap-3 rounded border border-slate-800 bg-slate-900/60 px-4 py-3">
      <span className="text-xs uppercase tracking-wide text-slate-400">{label}</span>
      <input
        type="range"
        min={Math.round(minBB * 10)}
        max={Math.round(maxBB * 10)}
        step={stepInt}
        value={Math.round(valueBB * 10)}
        onChange={(e) => onChange(Number(e.target.value) / 10)}
        className="flex-1 accent-amber-500"
        aria-label={label}
      />
      <span className="min-w-[64px] text-right font-mono text-sm font-semibold text-white">
        {valueBB.toFixed(1)} BB
      </span>
    </div>
  );
}
