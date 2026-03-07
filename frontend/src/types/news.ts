export type NewsBubbleLine = {
  id: string;
  text: string;
  source?: string;
};

export type TickerNewsEntry = {
  tickerId: string;
  summary: string;
  lines: NewsBubbleLine[];
};

export type DistrictNewsBoard = {
  districtId: string;
  lines: NewsBubbleLine[];
};
