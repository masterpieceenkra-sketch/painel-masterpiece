"use client";

import { ACTION_LABEL_PT, type Action, type ActionKind } from "@/domain/cards";
import { cn } from "@/lib/cn";

const VARIANT: Record<ActionKind, string> = {
  fold: "bg-slate-700 hover:bg-slate-600",
  call: "bg-sky-700 hover:bg-sky-600",
  check: "bg-sky-700 hover:bg-sky-600",
  raise: "bg-amber-600 hover:bg-amber-500",
  jam: "bg-rose-700 hover:bg-rose-600",
};

export function ActionButtons({
  actions,
  onChoose,
  disabled = false,
}: {
  actions: Action[];
  onChoose: (a: Action) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {actions.map((a, i) => {
        const label =
          a.kind === "raise"
            ? `Raise ${a.sizeBB}BB`
            : a.kind === "jam"
              ? "All-in"
              : ACTION_LABEL_PT[a.kind];
        return (
          <button
            type="button"
            key={`${a.kind}-${i}`}
            disabled={disabled}
            onClick={() => onChoose(a)}
            className={cn(
              "min-w-[120px] rounded-md px-5 py-3 font-semibold text-white shadow transition-colors",
              VARIANT[a.kind],
              disabled && "cursor-not-allowed opacity-50",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
