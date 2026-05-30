import { RANKS, RANK_INDEX, type HandCode, type Rank } from "@/domain/cards";

/**
 * Expande tokens compactos para HandCode[].
 *
 * Tokens suportados:
 * - "AA" — par único
 * - "22+" — pares de 22 a AA
 * - "TT-66" — intervalo de pares
 * - "AKs" / "AKo" — mão única
 * - "A2s+" / "K5o+" — fixa a carta alta, expande a baixa até (alta − 1)
 * - "AKs-A8s" — intervalo com carta alta fixa
 *
 * Conector ladder ("T9s+" → T9s, JTs, QJs, KQs, AKs) NÃO é suportado para
 * evitar ambiguidade — liste conectores explicitamente.
 */
export function expandTokens(input: string): HandCode[] {
  if (!input.trim()) return [];
  const parts = input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const result = new Set<HandCode>();
  for (const part of parts) {
    for (const hand of expandToken(part)) {
      result.add(hand);
    }
  }
  return [...result];
}

function expandToken(token: string): HandCode[] {
  if (token.includes("-")) {
    return expandRange(token);
  }
  return expandSingleOrPlus(token);
}

function expandSingleOrPlus(token: string): HandCode[] {
  const hasPlus = token.endsWith("+");
  const core = hasPlus ? token.slice(0, -1) : token;
  if (core.length === 2) {
    const hi = core[0] as Rank;
    const lo = core[1] as Rank;
    assertRank(hi, token);
    assertRank(lo, token);
    if (hi !== lo) {
      throw new Error(`Token de mão não-par exige 's' ou 'o' como sufixo: ${token}`);
    }
    if (!hasPlus) return [`${hi}${hi}`];
    const out: HandCode[] = [];
    for (let i = RANK_INDEX[hi]; i < RANKS.length; i++) {
      out.push(`${RANKS[i]}${RANKS[i]}`);
    }
    return out;
  }
  if (core.length === 3) {
    const hi = core[0] as Rank;
    const lo = core[1] as Rank;
    const sf = core[2];
    assertRank(hi, token);
    assertRank(lo, token);
    if (sf !== "s" && sf !== "o") {
      throw new Error(`Sufixo inválido: ${token}`);
    }
    if (RANK_INDEX[hi] <= RANK_INDEX[lo]) {
      throw new Error(`Primeira carta deve ser maior que a segunda: ${token}`);
    }
    if (!hasPlus) return [`${hi}${lo}${sf}`];
    if (RANK_INDEX[hi] - RANK_INDEX[lo] === 1) {
      throw new Error(
        `Token "${token}": cartas adjacentes (gap 1); o '+' não adiciona nenhuma mão nova ao kicker. ` +
          `Para connector ladder (ex.: T9s, JTs, QJs, KQs, AKs) liste explicitamente — esse formato compacto não é suportado.`,
      );
    }
    const out: HandCode[] = [];
    for (let i = RANK_INDEX[lo]; i < RANK_INDEX[hi]; i++) {
      out.push(`${hi}${RANKS[i]}${sf}`);
    }
    return out;
  }
  throw new Error(`Token desconhecido: ${token}`);
}

function expandRange(token: string): HandCode[] {
  const [aRaw, bRaw] = token.split("-").map((s) => s.trim());
  const a = expandSingleOrPlus(aRaw);
  const b = expandSingleOrPlus(bRaw);
  if (a.length !== 1 || b.length !== 1) {
    throw new Error(`Intervalo deve usar mãos únicas: ${token}`);
  }
  const [ah, al, as_] = [a[0][0] as Rank, a[0][1] as Rank, a[0][2] ?? ""];
  const [bh, bl, bs] = [b[0][0] as Rank, b[0][1] as Rank, b[0][2] ?? ""];
  if (as_ !== bs) throw new Error(`Sufixos diferentes no intervalo: ${token}`);

  if (ah === al && bh === bl) {
    const min = Math.min(RANK_INDEX[ah], RANK_INDEX[bh]);
    const max = Math.max(RANK_INDEX[ah], RANK_INDEX[bh]);
    const out: HandCode[] = [];
    for (let i = min; i <= max; i++) {
      out.push(`${RANKS[i]}${RANKS[i]}`);
    }
    return out;
  }
  if (ah === bh) {
    const min = Math.min(RANK_INDEX[al], RANK_INDEX[bl]);
    const max = Math.max(RANK_INDEX[al], RANK_INDEX[bl]);
    const out: HandCode[] = [];
    for (let i = min; i <= max; i++) {
      out.push(`${ah}${RANKS[i]}${as_}`);
    }
    return out;
  }
  throw new Error(`Intervalo sem carta alta em comum: ${token}`);
}

function assertRank(r: string, token: string): void {
  if (RANK_INDEX[r as Rank] == null) {
    throw new Error(`Rank inválido "${r}" em ${token}`);
  }
}
