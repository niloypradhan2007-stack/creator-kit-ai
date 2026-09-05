export type VideoAnalysis = {
  summary: string;
  tone: string;
  captions: string[];
  hooks: string[];
  titles: string[];
  hashtags: string[];
  description: string;
  score: {
    overall: number;
    hook: number;
    engagement: number;
    clarity: number;
    shareability: number;
  };
  suggestions: string[];
};
