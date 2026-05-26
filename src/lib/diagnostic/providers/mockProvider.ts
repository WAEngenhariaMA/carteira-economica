import { buildRuleFinancialDiagnosis } from "../ruleDiagnosticEngine";
import type { DiagnosticProvider } from "../types";

export const mockProvider: DiagnosticProvider = {
  name: "mock",
  label: "Mock",
  async generate(input) {
    const diagnosis = buildRuleFinancialDiagnosis(input);

    return {
      ...diagnosis,
      executiveSummary: `[Mock IA] ${diagnosis.executiveSummary}`,
      plainLanguageConclusion: `[Mock IA] ${diagnosis.plainLanguageConclusion}`,
    };
  },
};
