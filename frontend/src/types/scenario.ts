export type ProbabilityTag = "Low" | "Med" | "High";

export type Scenario = {
  id: string;
  title: string;
  probability: ProbabilityTag;
  summary: string;
  confirmSignals: string[];
  invalidateSignals: string[];
  rippleChips: string[];
};
