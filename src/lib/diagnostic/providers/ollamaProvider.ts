import { buildDiagnosticPrompt } from "../diagnosticPromptBuilder";
import type { DiagnosticProvider } from "../types";
import { validateDiagnosis } from "../types";

function readLocalAiUrl() {
  const configured = localStorage.getItem("ceia.localAiUrl");
  return configured || import.meta.env.VITE_LOCAL_AI_URL || "http://localhost:11434/api/chat";
}

function readLocalAiModel() {
  const configured = localStorage.getItem("ceia.localAiModel");
  return configured || import.meta.env.VITE_LOCAL_AI_MODEL || "qwen2.5:7b";
}

function readTimeoutMs() {
  const configured = Number(localStorage.getItem("ceia.aiTimeoutMs") || import.meta.env.VITE_AI_TIMEOUT_MS);
  return Number.isFinite(configured) && configured > 0 ? configured : 20000;
}

function extractJson(content: string) {
  const trimmed = content.trim();
  if (trimmed.startsWith("{")) return JSON.parse(trimmed);

  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("A IA local respondeu sem JSON válido.");
  return JSON.parse(match[0]);
}

export const ollamaProvider: DiagnosticProvider = {
  name: "ollama",
  label: "IA Local - Ollama",
  async generate(input) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), readTimeoutMs());

    try {
      const response = await fetch(readLocalAiUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model: readLocalAiModel(),
          messages: buildDiagnosticPrompt(input),
          stream: false,
          format: "json",
          options: {
            temperature: 0.2,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama indisponível: HTTP ${response.status}`);
      }

      const payload = await response.json();
      const content = String(payload?.message?.content ?? payload?.response ?? "");
      if (!content) throw new Error("Ollama respondeu vazio.");

      return validateDiagnosis(extractJson(content));
    } finally {
      window.clearTimeout(timeout);
    }
  },
};
