export interface AiDiagnosticResult {
  primaryProblem: string;
  secondaryProblem?: string;
  rootCause: string;
  risks: string[];
  recommendations: string[];
  confidence: number;
}
