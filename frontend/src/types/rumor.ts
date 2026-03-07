export type RumorSeverity = "Low" | "Elevated" | "Critical";

export type RumorPoster = {
  id: string;
  headline: string;
  districtId: string;
  severity: RumorSeverity;
  teaser: string;
};
