import type {
  AggregatedDiagnosticInput,
  DiagnosticAiMode,
  DiagnosticProvider,
  ProviderGenerationResult,
} from "./types";
import { cloudProvider } from "./providers/cloudProvider";
import { mockProvider } from "./providers/mockProvider";
import { ollamaProvider } from "./providers/ollamaProvider";
import { rulesProvider } from "./providers/rulesProvider";

function readAiMode(): DiagnosticAiMode {
  const configured = localStorage.getItem("ceia.aiMode") || import.meta.env.VITE_AI_MODE || "rules";
  const allowed: DiagnosticAiMode[] = ["disabled", "rules", "local", "edge-function", "auto", "mock"];
  return allowed.includes(configured as DiagnosticAiMode) ? configured as DiagnosticAiMode : "rules";
}

function cloudConfigured() {
  return Boolean(localStorage.getItem("ceia.cloudFunction") || import.meta.env.VITE_AI_DIAGNOSTIC_FUNCTION);
}

function providersForMode(mode: DiagnosticAiMode): DiagnosticProvider[] {
  if (mode === "disabled" || mode === "rules") return [rulesProvider];
  if (mode === "mock") return [mockProvider];
  if (mode === "local") return [ollamaProvider, rulesProvider];
  if (mode === "edge-function") return [cloudProvider, ollamaProvider, rulesProvider];
  if (cloudConfigured()) return [cloudProvider, ollamaProvider, rulesProvider];
  return [ollamaProvider, rulesProvider];
}

export async function generateFinancialDiagnosis(
  input: AggregatedDiagnosticInput,
  mode: DiagnosticAiMode = readAiMode(),
): Promise<ProviderGenerationResult> {
  const startedAt = performance.now();
  const providers = providersForMode(mode);
  const attemptedProviders: string[] = [];
  const errors: string[] = [];

  for (const provider of providers) {
    attemptedProviders.push(provider.name);
    try {
      const diagnosis = await provider.generate(input);
      const latencyMs = Math.round(performance.now() - startedAt);
      const fallbackUsed = attemptedProviders.length > 1 || provider.name === "rules" && mode !== "rules" && mode !== "disabled";

      return {
        provider: provider.name,
        providerLabel: provider.label,
        status: fallbackUsed ? "fallback" : "success",
        fallbackUsed,
        latencyMs,
        diagnosis,
        errorReason: errors.join(" | ") || undefined,
        attemptedProviders,
      };
    } catch (error) {
      errors.push(`${provider.label}: ${error instanceof Error ? error.message : "erro desconhecido"}`);
    }
  }

  const diagnosis = await rulesProvider.generate(input);
  return {
    provider: "rules",
    providerLabel: rulesProvider.label,
    status: "fallback",
    fallbackUsed: true,
    latencyMs: Math.round(performance.now() - startedAt),
    diagnosis,
    errorReason: errors.join(" | ") || "Fallback para regras puras.",
    attemptedProviders: [...attemptedProviders, "rules"],
  };
}
