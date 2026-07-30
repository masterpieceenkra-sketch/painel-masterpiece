import type { Action, Position } from "./cards";

export type PriorAction = {
  position: Position;
  action: Action;
};

export type IcmContext = "chipEV" | "bubble" | "finalTable";

export type IcmScenario = {
  stage: IcmContext;
  label: string;
  description: string;
  stacks: { label: string; stackBB: number; isHero?: boolean }[];
  payoutsPct: number[];
};

export type PushFoldSpot = {
  kind: "pushfold";
  id: string;
  effectiveBB: number;
  heroPos: Position;
  villainPos: Position;
  heroRole?: "jammer" | "caller";
  prior: PriorAction[];
  solutionRangeId: string;
  icmContext: IcmContext;
  icmScenario?: IcmScenario;
};

export type OpenRaiseSpot = {
  kind: "open";
  id: string;
  effectiveBB: number;
  heroPos: Position;
  prior: PriorAction[];
  defaultOpenSizeBB: number;
  solutionRangeId: string;
};

export type DefenseSpot = {
  kind: "defense";
  id: string;
  effectiveBB: number;
  heroPos: "BB" | "SB";
  villainPos: Position;
  villainAction: Action;
  default3betSizeBB: number;
  prior: PriorAction[];
  solutionRangeId: string;
};

export type PreflopSpot = PushFoldSpot | OpenRaiseSpot | DefenseSpot;
