import { POSITION_LABEL_PT, type Action, type Position } from "@/domain/cards";
import type { PriorAction } from "@/domain/spots";

function describe(a: Action): string {
  switch (a.kind) {
    case "fold":
      return "folda";
    case "call":
      return "paga";
    case "check":
      return "mesa";
    case "raise":
      return `abre ${a.sizeBB}BB`;
    case "jam":
      return "all-in";
  }
}

export function ActionHistoryLine({ prior, heroPos }: { prior: PriorAction[]; heroPos: Position }) {
  if (prior.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        Ação começa em você ({POSITION_LABEL_PT[heroPos]}).
      </p>
    );
  }
  return (
    <p className="text-sm text-slate-300">
      {prior.map((p, i) => (
        <span key={i}>
          <span className="font-semibold text-slate-100">{POSITION_LABEL_PT[p.position]}</span>{" "}
          {describe(p.action)}
          {i < prior.length - 1 ? ", " : "."}
        </span>
      ))}{" "}
      Ação com você ({POSITION_LABEL_PT[heroPos]}).
    </p>
  );
}
