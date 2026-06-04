import { buildDiagnosticPrompt } from "../diagnosticPromptBuilder";
import type { DiagnosticProvider } from "../types";
import { validateDiagnosis } from "../types";

const API_URL = "https://openrouter.ai/api/v1/chat/completions";

function readApiKey() {
  return localStorage.getItem("ceia.apiDirectKey") || "";
}

function readModel() {
  return localStorage.getItem("ceia.apiDirectModel") || "meta-llama/llama-3.1-8b-instruct:free";
}

function readTimeoutMs() {
  const v = Number(localStorage.getItem("ceia.aiTimeoutMs") || import.meta.env.VITE_AI_TIMEOUT_MS);
  return Number.isFinite(v) && v > 0 ? v : 30000;
}

function extractJson(content: string) {
  const trimmed = content.trim();
  if (trimmed.startsWith("{")) return JSON.parse(trimmed);
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("OpenRouter respondeu sem JSON válido.");
  return JSON.parse(match[0]);
}

export const openrouterProvider: DiagnosticProvider = {
  name: "openrouter",
  label: "OpenRouter",
  async generate(input) {
    const apiKey = readApiKey();
    if (!apiKey) throw new Error("Chave da API OpenRouter não configurada.");

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), readTimeoutMs());

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "Carteira Econômica IA",
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: readModel(),
          messages: buildDiagnosticPrompt(input),
          temperature: 0.2,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`OpenRouter HTTP ${response.status}: ${body.slice(0, 200)}`);
      }

      const payload = await response.json();
      const content = String(payload?.choices?.[0]?.message?.content ?? "");
      if (!content) throw new Error("OpenRouter respondeu vazio.");

      return validateDiagnosis(extractJson(content));
    } finally {
      window.clearTimeout(timeout);
    }
  },
};
