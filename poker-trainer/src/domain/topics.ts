export type DrillType = "pushfold" | "open" | "defense" | "postflop";

export type Topic = {
  id: string;
  slug: string;
  title: string;
  description: string;
  drillType: DrillType;
  spotIds: string[];
  targetAttempts: number;
};
