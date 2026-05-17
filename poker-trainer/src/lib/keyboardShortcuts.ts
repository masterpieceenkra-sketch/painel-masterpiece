import type { Action } from "@/domain/cards";

export type ShortcutKey = "F" | "C" | "R" | "J" | "SPACE" | "ENTER";

export function shortcutForAction(action: Action): ShortcutKey | null {
  switch (action.kind) {
    case "fold":
      return "F";
    case "call":
    case "check":
      return "C";
    case "raise":
      return "R";
    case "jam":
      return "J";
  }
}

export function eventKey(e: KeyboardEvent): ShortcutKey | null {
  if (e.metaKey || e.ctrlKey || e.altKey) return null;
  const target = e.target as HTMLElement | null;
  if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
    return null;
  }
  const k = e.key.toUpperCase();
  if (k === "F" || k === "C" || k === "R" || k === "J") return k as ShortcutKey;
  if (e.key === " ") return "SPACE";
  if (e.key === "Enter") return "ENTER";
  return null;
}
