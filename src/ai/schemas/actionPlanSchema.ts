export interface AiActionPlanItem {
  title: string;
  reason: string;
  priority: "urgent" | "high" | "medium" | "low";
  horizon: "7 dias" | "30 dias" | "60 dias" | "90 dias";
  expectedSavings: number;
  difficulty: "baixa" | "media" | "alta";
  trackingMetric: string;
}
