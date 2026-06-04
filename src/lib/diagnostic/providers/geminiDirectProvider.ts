import { buildDiagnosticPrompt } from "../diagnosticPromptBuilder";
import type { DiagnosticProvider } from "../types";
import { validateDiagnosis } from "../types";

function readApiKey() {
  return localStorage.getItem("ceia.apiDirectKey") || "";
}

function readModel() {
  return localStorage.getItem("ceia.apiDirectModel") || "gemini-2.0-flash-lite";
}

function readTimeoutMs() {
  const v = Number(localStorage.getItem("ceia.aiTimeoutMs") || import.meta.env.VITE_AI_TIMEOUT_MS);
  return Number.isFinite(v) && v > 0 ? v : 30000;
}

function buildUrl(model: string, apiKey: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
}

function toGeminiBody(messages: Array<{ role: string; content: string }>) {
  const system = messages.find((m) => m.role === "system");
  const turns = messages.filter((m) => m.role !== "system");
  return {
    ...(system && {
      system_instruction: { parts: [{ text: system.content }] },
    }),
    contents: turns.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
    },
  };
}

function extractJson(content: string) {
  const trimmed = content.trim();
  if (trimmed.startsWith("{")) return JSON.parse(trimmed);
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Gemini respondeu sem JSON válido.");
  return JSON.parse(match[0]);
}

export const geminiDirectProvider: DiagnosticProvider = {
  name: "gemini-direct",
  label: "Google Gemini",
  async generate(input) {
    const apiKey = readApiKey();
    if (!apiKey) throw new Error("Chave da API Gemini não configurada.");

    const model = readModel();
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), readTimeoutMs());

    try {
      const messages = buildDiagnosticPrompt(input);
      const response = await fetch(buildUrl(model, apiKey), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify(toGeminiBody(messages)),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`Gemini HTTP ${response.status}: ${body.slice(0, 200)}`);
      }

      const payload = await response.json();
      const content = String(payload?.candidates?.[0]?.content?.parts?.[0]?.text ?? "");
      if (!content) throw new Error("Gemini respondeu vazio.");

      return validateDiagnosis(extractJson(content));
    } finally {
      window.clearTimeout(timeout);
    }
  },
};
