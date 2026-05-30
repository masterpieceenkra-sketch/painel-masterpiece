import { cn } from "@/lib/cn";

type Size = "sm" | "md";

const SIZE: Record<Size, string> = {
  sm: "h-4 w-4 text-[8px]",
  md: "h-6 w-6 text-[10px]",
};

/**
 * White-and-gold dealer button. `size="sm"` is intended for inline usage
 * next to a seat label; `size="md"` is the felt-level button.
 */
export function DealerButton({
  size = "md",
  className,
}: {
  size?: Size;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label="Botão do dealer"
      className={cn(
        "flex items-center justify-center rounded-full border border-amber-300/70 bg-gradient-to-b from-white to-amber-100 font-extrabold text-amber-900 shadow-md shadow-amber-900/50 ring-1 ring-black/20",
        SIZE[size],
        className,
      )}
    >
      D
    </div>
  );
}
