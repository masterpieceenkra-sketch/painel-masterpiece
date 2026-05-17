import { RANK_INDEX, type Card, type HandCode, type Rank } from "@/domain/cards";

export function handCodeOf(a: Card, b: Card): HandCode {
  const hi = RANK_INDEX[a.rank] >= RANK_INDEX[b.rank] ? a : b;
  const lo = hi === a ? b : a;
  if (hi.rank === lo.rank) return `${hi.rank}${lo.rank}`;
  return `${hi.rank}${lo.rank}${hi.suit === lo.suit ? "s" : "o"}`;
}

export function parseHandCode(code: HandCode): { hi: Rank; lo: Rank; kind: "pair" | "suited" | "offsuit" } {
  const hi = code[0] as Rank;
  const lo = code[1] as Rank;
  if (hi === lo) return { hi, lo, kind: "pair" };
  const suffix = code[2];
  return { hi, lo, kind: suffix === "s" ? "suited" : "offsuit" };
}

export function isValidHandCode(code: string): code is HandCode {
  if (code.length !== 2 && code.length !== 3) return false;
  const hi = code[0] as Rank;
  const lo = code[1] as Rank;
  if (RANK_INDEX[hi] == null || RANK_INDEX[lo] == null) return false;
  if (hi === lo) return code.length === 2;
  if (code.length !== 3) return false;
  if (code[2] !== "s" && code[2] !== "o") return false;
  return RANK_INDEX[hi] > RANK_INDEX[lo];
}
