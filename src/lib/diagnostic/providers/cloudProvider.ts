import { getSupabase } from "../../supabase";
import type { DiagnosticProvider } from "../types";
import { validateDiagnosis } from "../types";

function readFunctionName() {
  return localStorage.getItem("ceia.cloudFunction")
    || import.meta.env.VITE_AI_DIAGNOSTIC_FUNCTION
    || "generate-diagnostic";
}

export const cloudProvider: DiagnosticProvider = {
  name: "cloud",
  label: "IA em Nuvem - Edge Function",
  async generate(input) {
    const { data, error } = await getSupabase().functions.invoke(readFunctionName(), {
      body: {
        provider: localStorage.getItem("ceia.cloudProvider") || import.meta.env.VITE_CLOUD_AI_PROVIDER || "gemini",
        input,
      },
    });

    if (error) throw error;
    return validateDiagnosis(data?.diagnosis ?? data);
  },
};
