import { getSupabase } from "../lib/supabase";
import type { DiagnosticFinding, FinancialSummary } from "../types/finance";

export const diagnosticService = {
  async save(userId: string, competence: string, summary: FinancialSummary, findings: DiagnosticFinding[]) {
    const { data, error } = await getSupabase()
      .from("diagnostics")
      .insert({
        user_id: userId,
        competence,
        health_score: summary.healthScore,
        risk_level: summary.riskLevel,
        summary,
        findings,
      })
      .select("*")
      .single();

    if (error) throw error;
    return data;
  },

  async history(userId: string) {
    const { data, error } = await getSupabase()
      .from("diagnostics")
      .select("*")
      .eq("user_id", userId)
      .order("competence", { ascending: false })
      .limit(24);

    if (error) throw error;
    return data ?? [];
  },
};
