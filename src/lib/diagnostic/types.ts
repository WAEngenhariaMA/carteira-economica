import type { ActionItem, DiagnosticFinding, RiskLevel } from "../../types/finance";

export type DiagnosticAiMode =
  | "disabled"
  | "rules"
  | "local"
  | "edge-function"
  | "auto"
  | "mock";

export type DiagnosticProviderName = "rules" | "ollama" | "cloud" | "mock";

export interface DiagnosticMainProblem {
  title: string;
  meaning: string;
  risk: string;
  action: string;
}

export interface DiagnosticNextActions {
  today: string[];
  sevenDays: string[];
  thirtyDays: string[];
  ninetyDays: string[];
}

export interface DiagnosticScoreExplanation {
  whyDropped: string[];
  howToImprove: string[];
}

export interface FinancialDiagnosis {
  executiveSummary: string;
  simpleExplanation: string;
  rootCause: string;
  riskLevel: Exclude<RiskLevel, "excellent">;
  mainProblems: DiagnosticMainProblem[];
  nextActions: DiagnosticNextActions;
  scoreExplanation: DiagnosticScoreExplanation;
  plainLanguageConclusion: string;
}

export interface AggregatedDiagnosticInput {
  competence: string;
  summary: {
    receivedIncome: number;
    pendingIncome: number;
    expectedIncome: number;
    paidExpenses: number;
    openExpenses: number;
    cardInvoices: number;
    openCardInvoices: number;
    paidCardInvoices: number;
    debtPayments: number;
    futureInstallmentsTotal: number;
    futureCommitmentsTotal: number;
    projectedBalance: number;
    realizedBalance: number;
    cashShortfall: number;
    commitmentRatio: number;
    cardRatio: number;
    debtRatio: number;
    healthScore: number;
    riskLevel: RiskLevel;
    safeDailySpend: number;
    safeWeeklySpend: number;
    urgentAmount: number;
    moneyLastsDays: number;
    monthsCommittedCount: number;
    potentialSavings: number;
    dataQualityScore: number;
    dataReliabilityLabel: string;
    idealIncome: number;
    reserveTarget: number;
  };
  highlights: {
    topCard?: string;
    topCategory?: string;
    biggestLeak?: string;
    mostHarmfulExpense?: string;
  };
  findings: DiagnosticFinding[];
  suggestedActions: ActionItem[];
  scoreDroppedReasons: string[];
  scoreImprovementSuggestions: string[];
  dataQualityIssues: string[];
}

export interface ProviderGenerationResult {
  provider: DiagnosticProviderName;
  providerLabel: string;
  status: "success" | "fallback" | "error";
  fallbackUsed: boolean;
  latencyMs: number;
  diagnosis: FinancialDiagnosis;
  errorReason?: string;
  attemptedProviders: string[];
}

export interface DiagnosticProvider {
  name: DiagnosticProviderName;
  label: string;
  generate(input: AggregatedDiagnosticInput): Promise<FinancialDiagnosis>;
}

export function isRiskLevel(value: unknown): value is FinancialDiagnosis["riskLevel"] {
  return value === "healthy"
    || value === "attention"
    || value === "risk"
    || value === "critical"
    || value === "emergency";
}

export function validateDiagnosis(value: unknown): FinancialDiagnosis {
  if (!value || typeof value !== "object") {
    throw new Error("Resposta de diagnóstico vazia ou inválida.");
  }

  const candidate = value as Partial<FinancialDiagnosis>;

  if (
    typeof candidate.executiveSummary !== "string"
    || typeof candidate.simpleExplanation !== "string"
    || typeof candidate.rootCause !== "string"
    || !isRiskLevel(candidate.riskLevel)
    || !Array.isArray(candidate.mainProblems)
    || !candidate.nextActions
    || !candidate.scoreExplanation
    || typeof candidate.plainLanguageConclusion !== "string"
  ) {
    throw new Error("Resposta de diagnóstico fora do contrato esperado.");
  }

  return {
    executiveSummary: candidate.executiveSummary,
    simpleExplanation: candidate.simpleExplanation,
    rootCause: candidate.rootCause,
    riskLevel: candidate.riskLevel,
    mainProblems: candidate.mainProblems
      .filter((problem): problem is DiagnosticMainProblem =>
        Boolean(problem)
        && typeof problem.title === "string"
        && typeof problem.meaning === "string"
        && typeof problem.risk === "string"
        && typeof problem.action === "string",
      )
      .slice(0, 6),
    nextActions: {
      today: Array.isArray(candidate.nextActions.today) ? candidate.nextActions.today.map(String).slice(0, 5) : [],
      sevenDays: Array.isArray(candidate.nextActions.sevenDays) ? candidate.nextActions.sevenDays.map(String).slice(0, 5) : [],
      thirtyDays: Array.isArray(candidate.nextActions.thirtyDays) ? candidate.nextActions.thirtyDays.map(String).slice(0, 5) : [],
      ninetyDays: Array.isArray(candidate.nextActions.ninetyDays) ? candidate.nextActions.ninetyDays.map(String).slice(0, 5) : [],
    },
    scoreExplanation: {
      whyDropped: Array.isArray(candidate.scoreExplanation.whyDropped)
        ? candidate.scoreExplanation.whyDropped.map(String).slice(0, 8)
        : [],
      howToImprove: Array.isArray(candidate.scoreExplanation.howToImprove)
        ? candidate.scoreExplanation.howToImprove.map(String).slice(0, 8)
        : [],
    },
    plainLanguageConclusion: candidate.plainLanguageConclusion,
  };
}
