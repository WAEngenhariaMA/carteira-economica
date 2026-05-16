export interface ClassificationResult {
  category: string;
  subcategory: string;
  essentiality: "essential" | "important" | "superfluous" | "impulsive";
  priority: "mandatory" | "adjustable" | "cuttable" | "renegotiable";
  impact: "low" | "medium" | "high" | "severe";
  confidence: number;
  needsReview: boolean;
}
