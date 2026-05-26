import { generateFinancialDiagnosis as runProviderFactory } from "../lib/diagnostic/diagnosticProviderFactory";
import type { AggregatedDiagnosticInput, DiagnosticAiMode, ProviderGenerationResult } from "../lib/diagnostic/types";
import { getSupabase } from "../lib/supabase";
import type { ActionItem, DiagnosticFinding, FinancialSummary } from "../types/finance";

function labelHighlight(label?: string, value?: string) {
  if (!label) return undefined;
  return value ? `${label} (${value})` : label;
}

export function buildAggregatedDiagnosticInput({
  competence,
  summary,
  findings,
  actions,
  scoreDroppedReasons,
  scoreImprovementSuggestions,
}: {
  competence: string;
  summary: FinancialSummary;
  findings: DiagnosticFinding[];
  actions: ActionItem[];
  scoreDroppedReasons: string[];
  scoreImprovementSuggestions: string[];
}): AggregatedDiagnosticInput {
  return {
    competence,
    summary: {
      receivedIncome: summary.confirmedIncome,
      pendingIncome: summary.pendingIncome,
      expectedIncome: summary.expectedIncome,
      paidExpenses: summary.paidDirectExpenses,
      openExpenses: summary.pendingDirectExpenses,
      cardInvoices: summary.cardInvoices,
      openCardInvoices: summary.openCardInvoices,
      paidCardInvoices: summary.paidCardInvoices,
      debtPayments: summary.debtPayments,
      futureInstallmentsTotal: summary.futureInstallmentsTotal,
      futureCommitmentsTotal: summary.futureCommitmentsTotal,
      projectedBalance: summary.projectedBalance,
      realizedBalance: summary.realizedBalance,
      cashShortfall: summary.cashShortfall,
      commitmentRatio: summary.committedIncomeRatio,
      cardRatio: summary.cardIncomeRatio,
      debtRatio: summary.debtRatio,
      healthScore: summary.healthScore,
      riskLevel: summary.riskLevel,
      safeDailySpend: summary.safeDailySpend,
      safeWeeklySpend: summary.safeWeeklySpend,
      urgentAmount: summary.urgentAmount,
      moneyLastsDays: summary.moneyLastsDays,
      monthsCommittedCount: summary.monthsCommittedCount,
      potentialSavings: summary.potentialSavings,
      dataQualityScore: summary.dataQualityScore,
      dataReliabilityLabel: summary.dataReliabilityLabel,
      idealIncome: summary.automaticIdealIncome.amount,
      reserveTarget: summary.reserveTargets.selectedTarget,
    },
    highlights: {
      topCard: labelHighlight(summary.topCardRisk?.label, summary.topCardRisk?.value),
      topCategory: labelHighlight(summary.topCategory?.label, summary.topCategory?.value),
      biggestLeak: labelHighlight(summary.biggestLeak?.label, summary.biggestLeak?.value),
      mostHarmfulExpense: labelHighlight(summary.mostHarmfulExpense?.label, summary.mostHarmfulExpense?.value),
    },
    findings,
    suggestedActions: actions,
    scoreDroppedReasons,
    scoreImprovementSuggestions,
    dataQualityIssues: summary.dataQualityIssues.map((issue) => issue.message).slice(0, 12),
  };
}

async function safeRegisterAiLog({
  userId,
  result,
  competence,
}: {
  userId: string;
  result: ProviderGenerationResult;
  competence: string;
}) {
  try {
    await getSupabase()
      .from("ai_logs")
      .insert({
        user_id: userId,
        function_name: "generate-diagnostic",
        prompt_version: "diagnostic-v1",
        result: {
          provider: result.provider,
          status: result.status,
          fallbackUsed: result.fallbackUsed,
          latencyMs: result.latencyMs,
          competence,
          attemptedProviders: result.attemptedProviders,
        },
        status: result.status === "error" ? "error" : "success",
        error_message: result.errorReason ?? null,
      });
  } catch {
    // A tabela ai_logs é opcional para ambientes antigos; diagnóstico não pode quebrar por log.
  }
}

export const diagnosticAiService = {
  async generate(input: AggregatedDiagnosticInput, userId: string, mode?: DiagnosticAiMode) {
    const result = await runProviderFactory(input, mode);
    await safeRegisterAiLog({ userId, result, competence: input.competence });
    return result;
  },
};
