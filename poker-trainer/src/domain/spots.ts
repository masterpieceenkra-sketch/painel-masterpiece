import type { Action, Position } from "./cards";

export type PriorAction = {
  position: Position;
  action: Action;
};

export type PushFoldSpot = {
  kind: "pushfold";
  id: string;
  effectiveBB: number;
  heroPos: Position;
  villainPos: Position;
  prior: PriorAction[];
  solutionRangeId: string;
  icmContext: "chipEV";
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
  prior: PriorAction[];
  solutionRangeId: string;
};

export type PreflopSpot = PushFoldSpot | OpenRaiseSpot | DefenseSpot;
