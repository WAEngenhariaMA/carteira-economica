import { buildRuleFinancialDiagnosis } from "../ruleDiagnosticEngine";
import type { DiagnosticProvider } from "../types";

export const rulesProvider: DiagnosticProvider = {
  name: "rules",
  label: "Regras Puras",
  async generate(input) {
    return buildRuleFinancialDiagnosis(input);
  },
};
