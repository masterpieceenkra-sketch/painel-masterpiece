/**
 * Malmuth-Harville ICM equity.
 *
 * Computes each player's expected $ share given current chip stacks and a
 * payout structure. Used here for educational display in ICM-context spots
 * (we pre-bake the ranges; equity is shown to motivate why GTO tightens).
 *
 * Reference: Mason Malmuth, "Gambling Theory and Other Topics" (1987).
 * Harville extension generalizes to N finish positions.
 */
export function icmEquity(stacks: number[], payoutsPct: number[]): number[] {
  const n = stacks.length;
  const equity = new Array(n).fill(0);
  if (n === 0) return equity;

  // Trim payouts to at most n.
  const payouts = payoutsPct.slice(0, n);
  while (payouts.length < n) payouts.push(0);

  // Iterative Malmuth-Harville: each player's probability of finishing
  // in position k is computed by recursion over remaining stacks.
  // For tractability up to ~12 players we use the recursive formulation.

  function probFinish(remaining: number[], indices: number[], place: number): number[] {
    // remaining = current stack array, indices = original index of each.
    // place = which finish position to compute (0 = winner).
    // Returns probability vector over `indices`.
    const total = remaining.reduce((a, b) => a + b, 0);
    if (place === 0) {
      return remaining.map((s) => (total > 0 ? s / total : 0));
    }
    const probs = new Array(remaining.length).fill(0);
    for (let i = 0; i < remaining.length; i++) {
      const pWin = total > 0 ? remaining[i] / total : 0;
      const restStacks = remaining.filter((_, j) => j !== i);
      const restIdx = indices.filter((_, j) => j !== i);
      const subProbs = probFinish(restStacks, restIdx, place - 1);
      for (let j = 0; j < restIdx.length; j++) {
        const originalJ = indices.indexOf(restIdx[j]);
        probs[originalJ] += pWin * subProbs[j];
      }
    }
    return probs;
  }

  const indices = stacks.map((_, i) => i);
  for (let place = 0; place < payouts.length; place++) {
    const probs = probFinish(stacks, indices, place);
    for (let i = 0; i < n; i++) {
      equity[i] += probs[i] * payouts[place];
    }
  }
  return equity;
}

export function formatStacks(stacks: { label: string; stackBB: number; isHero?: boolean }[]): string {
  return stacks
    .map((s) => `${s.label}${s.isHero ? " (você)" : ""} ${s.stackBB}BB`)
    .join(" · ");
}
