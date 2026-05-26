import type { AggregatedDiagnosticInput, FinancialDiagnosis } from "./types";

function riskLabel(level: string) {
  const labels: Record<string, string> = {
    healthy: "saudável",
    attention: "atenção",
    risk: "risco",
    critical: "crítica",
    emergency: "emergência",
  };

  return labels[level] ?? level;
}

function money(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function buildRootCause(input: AggregatedDiagnosticInput) {
  if (input.summary.projectedBalance < 0) {
    return "A causa principal é que os compromissos do mês superam a renda prevista da competência.";
  }

  if (input.summary.cardRatio > 0.3) {
    return "A causa principal é o peso dos cartões sobre a renda do mês.";
  }

  if (input.summary.cashShortfall > 0) {
    return "A causa principal é a diferença entre o caixa já recebido e as contas ainda abertas.";
  }

  if (input.summary.dataQualityScore < 70) {
    return "A causa principal é a baixa confiabilidade de alguns dados cadastrados.";
  }

  return "A base não mostra uma causa crítica única; o foco deve ser manter rotina de controle e evitar crescimento de faturas.";
}

function firstActions(input: AggregatedDiagnosticInput) {
  const urgent = input.summary.urgentAmount;
  const today = urgent > 0
    ? [
      `Resolver ${money(urgent)} de diferença do mês antes de fazer novas compras.`,
      "Separar vencimentos por prioridade: essencial, juros alto, vencimento próximo e ajustável.",
      "Pausar novas compras parceladas até o mês fechar.",
    ]
    : [
      "Conferir se receitas, despesas, faturas e parcelas do mês estão cadastradas.",
      "Definir limite diário e semanal de gasto variável.",
    ];

  return {
    today,
    sevenDays: [
      "Confirmar receitas pendentes e datas reais de recebimento.",
      "Revisar o cartão mais perigoso e cortar recorrências dispensáveis.",
      "Definir teto semanal para alimentação fora, lazer, compras e delivery.",
    ],
    thirtyDays: [
      "Reduzir faturas para abaixo de 30% da renda do mês.",
      "Cancelar ou pausar gastos ajustáveis de maior recorrência.",
      "Reorganizar vencimentos para evitar concentração de contas.",
    ],
    ninetyDays: [
      "Levar o comprometimento para abaixo de 70% da renda.",
      "Começar ou recompor reserva mínima.",
      "Eliminar parcelas pequenas que drenam caixa todo mês.",
    ],
  };
}

export function buildRuleFinancialDiagnosis(input: AggregatedDiagnosticInput): FinancialDiagnosis {
  const riskLevel = input.summary.riskLevel === "excellent" ? "healthy" : input.summary.riskLevel;
  const commitmentText = Math.round(input.summary.commitmentRatio * 1000) / 10;
  const balanceText = input.summary.projectedBalance < 0
    ? `faltam ${money(Math.abs(input.summary.projectedBalance))} para fechar o mês sem crédito, reserva ou atraso`
    : `sobram ${money(input.summary.projectedBalance)} depois dos compromissos previstos`;
  const mainProblems = input.findings.length > 0
    ? input.findings.slice(0, 5).map((finding) => ({
      title: finding.title,
      meaning: finding.meaning,
      risk: finding.risk,
      action: finding.recommendedAction,
    }))
    : [
      {
        title: "Manter disciplina financeira",
        meaning: "Não há achado crítico na competência selecionada.",
        risk: "Sem acompanhamento, faturas e gastos variáveis podem crescer sem percepção.",
        action: "Manter revisão semanal e registrar todos os lançamentos relevantes.",
      },
    ];

  return {
    executiveSummary: `Sua situação financeira está em nível ${riskLabel(riskLevel)}. O comprometimento do mês está em ${commitmentText}% e ${balanceText}.`,
    simpleExplanation: `Você tem ${money(input.summary.expectedIncome)} previstos para a competência, com ${money(input.summary.receivedIncome)} já recebidos e ${money(input.summary.pendingIncome)} a receber. Seus compromissos somam despesas, faturas, dívidas e parcelas cadastradas no mês.`,
    rootCause: buildRootCause(input),
    riskLevel,
    mainProblems,
    nextActions: firstActions(input),
    scoreExplanation: {
      whyDropped: input.scoreDroppedReasons.length > 0
        ? input.scoreDroppedReasons
        : ["Nenhum fator crítico derrubando a nota no momento."],
      howToImprove: input.scoreImprovementSuggestions,
    },
    plainLanguageConclusion: input.summary.projectedBalance < 0
      ? `A decisão mais importante é resolver ${money(Math.abs(input.summary.projectedBalance))} do fluxo antes dos vencimentos. Investimento fica para depois do caixa voltar a fechar.`
      : "A decisão mais importante é preservar a sobra, manter teto semanal e direcionar parte do resultado para reserva ou objetivo prioritário.",
  };
}
