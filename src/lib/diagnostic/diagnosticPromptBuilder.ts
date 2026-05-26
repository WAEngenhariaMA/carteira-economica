import type { AggregatedDiagnosticInput } from "./types";

export function buildDiagnosticPrompt(input: AggregatedDiagnosticInput) {
  return [
    {
      role: "system",
      content:
        "Você é um consultor financeiro pessoal. Sua função é explicar dados financeiros já calculados pelo sistema em linguagem simples, sem recalcular valores. Não invente números, não altere percentuais, não crie dados que não foram enviados e não recomende investimento antes de resolver saldo negativo ou dívidas críticas. Não recomende crédito como primeira opção sem alertar risco. Responda apenas JSON válido, sem markdown e sem texto fora do JSON.",
    },
    {
      role: "user",
      content: JSON.stringify({
        instruction:
          "Explique a saúde financeira para uma pessoa leiga. Use somente os dados agregados enviados. Produza diagnóstico consultivo, objetivo e acionável.",
        responseSchema: {
          executiveSummary: "string",
          simpleExplanation: "string",
          rootCause: "string",
          riskLevel: "healthy | attention | risk | critical | emergency",
          mainProblems: [
            {
              title: "string",
              meaning: "string",
              risk: "string",
              action: "string",
            },
          ],
          nextActions: {
            today: ["string"],
            sevenDays: ["string"],
            thirtyDays: ["string"],
            ninetyDays: ["string"],
          },
          scoreExplanation: {
            whyDropped: ["string"],
            howToImprove: ["string"],
          },
          plainLanguageConclusion: "string",
        },
        financialData: input,
      }),
    },
  ];
}
