import type {
  ActionItem,
  AlertItem,
  Card,
  Debt,
  DiagnosticFinding,
  FinancialSummary,
  RiskLevel,
} from "../types/finance";
import { formatMoney, formatPercent, riskLabel } from "./formatters";

export interface FinancialTermExplanation {
  term: string;
  explanation: string;
}

export interface HorizonPlanItem {
  horizon: "7 dias" | "30 dias" | "90 dias";
  title: string;
  description: string;
  expectedImpact: number;
}

export interface PriorityActionExplanation {
  title: string;
  reason: string;
  impact: string;
}

export interface TechnicalDiagnosisLine {
  label: string;
  value: string;
  interpretation: string;
}

export interface FinancialExplanation {
  simpleMonthSummary: string;
  scoreExplanation: string;
  commitmentExplanation: string;
  balanceExplanation: string;
  cardsExplanation: string;
  installmentsExplanation: string;
  whatToDoFirst: PriorityActionExplanation[];
  horizonPlan: HorizonPlanItem[];
  plainLanguageAlerts: string[];
  scoreImprovementSuggestions: string[];
  executiveDiagnosis: string;
  technicalDiagnosis: TechnicalDiagnosisLine[];
  glossary: FinancialTermExplanation[];
}

interface FinancialExplanationInput {
  summary: FinancialSummary;
  cards: Card[];
  debts: Debt[];
  diagnostics: DiagnosticFinding[];
  actions: ActionItem[];
  alerts: AlertItem[];
}

function riskPhrase(level: RiskLevel) {
  const phrases: Record<RiskLevel, string> = {
    excellent: "a situação está excelente",
    healthy: "a situação está saudável",
    attention: "a situação pede atenção",
    risk: "a situação está em risco de aperto",
    critical: "a situação está crítica",
    emergency: "a situação está em emergência",
  };

  return phrases[level];
}

function firstPositive(values: number[]) {
  return values.find((value) => value > 0) ?? 0;
}

function highestCardRisk(cards: Card[]) {
  return cards.reduce<Card | null>((current, card) => {
    if (!current) return card;
    const currentRatio = current.limit > 0 ? current.currentInvoice / current.limit : 0;
    const cardRatio = card.limit > 0 ? card.currentInvoice / card.limit : 0;
    return cardRatio > currentRatio ? card : current;
  }, null);
}

function strongestFutureMonth(summary: FinancialSummary) {
  return summary.futureCommitments.slice(1).reduce(
    (current, month) => (month.total > current.total ? month : current),
    summary.futureCommitments[1] ?? summary.futureCommitments[0],
  );
}

function sentenceJoin(parts: string[]) {
  return parts.filter(Boolean).join(" ");
}

function buildSimpleMonthSummary(summary: FinancialSummary) {
  const balanceText = summary.projectedBalance < 0
    ? `Seu saldo previsto ficou em ${formatMoney(summary.projectedBalance)}. Isso significa que faltam ${formatMoney(Math.abs(summary.projectedBalance))} para fechar o mês sem aperto.`
    : `Seu saldo previsto ficou em ${formatMoney(summary.projectedBalance)}. Isso significa que sobram ${formatMoney(summary.projectedBalance)} depois dos compromissos previstos.`;
  const receivedText = summary.pendingIncome > 0
    ? `Desse valor, ${formatMoney(summary.confirmedIncome)} já entrou no caixa e ${formatMoney(summary.pendingIncome)} ainda depende de recebimento.`
    : `A renda informada para o mês está totalmente marcada como recebida.`;

  return sentenceJoin([
    `Você tem ${formatMoney(summary.expectedIncome)} previstos para este mês, e seus compromissos somam ${formatMoney(summary.totalOutflow)}.`,
    receivedText,
    balanceText,
    summary.projectedBalance < 0
      ? "A prioridade agora é proteger o caixa, travar novas parcelas e atacar os compromissos que mais pressionam o mês."
      : "O próximo passo é manter o controle semanal e direcionar parte da sobra para reserva, dívida ou meta prioritária.",
  ]);
}

function buildScoreExplanation(summary: FinancialSummary) {
  const reasons: string[] = [];

  if (summary.committedIncomeRatio > 0.7) reasons.push("a renda está muito comprometida");
  if (summary.cardIncomeRatio > 0.3) reasons.push("os cartões passaram do limite saudável");
  if (summary.projectedBalance < 0) reasons.push("o saldo previsto está negativo");
  if (summary.cashShortfall > 0) reasons.push("há contas abertas sem cobertura pelo caixa já realizado");
  if (summary.futureInstallmentsTotal > summary.income * 0.5 && summary.income > 0) reasons.push("as parcelas futuras mantêm pressão nos próximos meses");

  if (reasons.length === 0) {
    return `Sua nota é ${summary.healthScore}/100 porque o fluxo mensal está sob controle e os principais riscos não passaram dos limites técnicos.`;
  }

  return `Sua nota é ${summary.healthScore}/100 porque ${reasons.join(", ")}. Quanto mais esses pontos forem reduzidos, mais rápido o score melhora.`;
}

function buildCommitmentExplanation(summary: FinancialSummary) {
  if (summary.income <= 0) {
    return "Não há renda cadastrada para medir comprometimento. Sem esse dado, o sistema não consegue dizer se as despesas estão leves ou pesadas.";
  }

  const commitment = formatPercent(summary.committedIncomeRatio);
  if (summary.committedIncomeRatio > 1) {
    return `O comprometimento está em ${commitment}. Na prática, os compromissos do mês são maiores que a renda prevista, então a conta não fecha sem corte, renegociação ou entrada extra.`;
  }

  if (summary.committedIncomeRatio > 0.7) {
    return `O comprometimento está em ${commitment}. Esse nível é alto: sobra pouco espaço para imprevistos e qualquer atraso de receita pode virar aperto.`;
  }

  if (summary.committedIncomeRatio > 0.55) {
    return `O comprometimento está em ${commitment}. O mês ainda pode ser administrável, mas precisa de teto de gastos e cuidado com cartão.`;
  }

  return `O comprometimento está em ${commitment}. Esse nível tende a ser saudável, desde que as faturas e parcelas futuras não estejam crescendo.`;
}

function buildBalanceExplanation(summary: FinancialSummary) {
  if (summary.projectedBalance < 0) {
    return `O saldo previsto é negativo em ${formatMoney(Math.abs(summary.projectedBalance))}. Isso mostra o tamanho mínimo do ajuste necessário para fechar a competência sem depender de crédito.`;
  }

  if (summary.realizedBalance < 0) {
    return `O saldo previsto é positivo, mas o caixa realizado está em ${formatMoney(summary.realizedBalance)}. Ou seja: o mês depende de entradas que ainda precisam acontecer.`;
  }

  return `O saldo previsto é positivo em ${formatMoney(summary.projectedBalance)}. O foco deve ser preservar essa sobra até o fim do mês e definir destino para ela.`;
}

function buildCardsExplanation(summary: FinancialSummary, cards: Card[]) {
  if (cards.length === 0) {
    return "Nenhum cartão foi cadastrado. Sem cartões, o risco de fatura não entra no diagnóstico.";
  }

  const riskiestCard = highestCardRisk(cards);
  const ratio = riskiestCard && riskiestCard.limit > 0 ? riskiestCard.currentInvoice / riskiestCard.limit : 0;
  const riskText = riskiestCard
    ? `O cartão mais sensível é ${riskiestCard.bank}, com ${formatPercent(ratio)} do limite usado e fatura de ${formatMoney(riskiestCard.currentInvoice)}.`
    : "";

  if (summary.cardIncomeRatio > 0.3) {
    return `${riskText} No consolidado, as faturas representam ${formatPercent(summary.cardIncomeRatio)} da renda do mês, acima do limite prudente de 30%.`;
  }

  return `${riskText} No consolidado, as faturas representam ${formatPercent(summary.cardIncomeRatio)} da renda do mês. O nível é administrável se novas compras parceladas forem controladas.`;
}

function buildInstallmentsExplanation(summary: FinancialSummary) {
  const strongestMonth = strongestFutureMonth(summary);
  const monthText = strongestMonth
    ? `O mês futuro mais pesado na projeção é ${strongestMonth.month}, com ${formatMoney(strongestMonth.total)} em compromissos.`
    : "";

  if (summary.futureInstallmentsTotal <= 0) {
    return "Não há parcelas futuras relevantes cadastradas. Isso melhora a flexibilidade dos próximos meses.";
  }

  return `${monthText} Nos próximos 5 meses, há ${formatMoney(summary.futureCommitmentsTotal)} em compromissos projetados, incluindo faturas, parcelas, fixos, variáveis recorrentes, dívidas e empréstimos. Mesmo parando de gastar hoje, essa pressão ainda precisa ser administrada.`;
}

function buildWhatToDoFirst(summary: FinancialSummary, actions: ActionItem[]) {
  const generated: PriorityActionExplanation[] = [];

  if (summary.cashShortfall > 0) {
    generated.push({
      title: "Cobrir o buraco de caixa do mês",
      reason: `Há ${formatMoney(summary.cashShortfall)} em compromissos sem cobertura pelo caixa realizado.`,
      impact: "Evita atraso, juros e uso emergencial de crédito.",
    });
  }

  if (summary.cardIncomeRatio > 0.3) {
    generated.push({
      title: "Congelar novas compras no cartão",
      reason: `As faturas consomem ${formatPercent(summary.cardIncomeRatio)} da renda do mês.`,
      impact: `Pode reduzir pressão em cerca de ${formatMoney(Math.max(summary.cardInvoices * 0.18, 0))}.`,
    });
  }

  if (summary.potentialSavings > 0) {
    generated.push({
      title: "Cortar gastos ajustáveis",
      reason: "Há despesas supérfluas ou impulsivas na competência.",
      impact: `Economia potencial estimada em ${formatMoney(summary.potentialSavings)}.`,
    });
  }

  actions.slice(0, 3).forEach((action) => {
    if (generated.some((item) => item.title === action.title)) return;
    generated.push({
      title: action.title,
      reason: action.reason,
      impact: `Impacto estimado de ${formatMoney(action.expectedSavings)}.`,
    });
  });

  if (generated.length === 0) {
    generated.push({
      title: "Manter rotina semanal de revisão",
      reason: "A base atual não mostra pressão crítica.",
      impact: "Ajuda a preservar o score e evita que pequenos gastos virem problema.",
    });
  }

  return generated.slice(0, 5);
}

function buildHorizonPlan(summary: FinancialSummary) {
  const immediateImpact = firstPositive([
    summary.cashShortfall,
    Math.abs(Math.min(summary.projectedBalance, 0)),
    summary.cardInvoices * 0.18,
  ]);
  const monthlyAdjustment = Math.max(
    summary.totalOutflow - summary.income * 0.7,
    summary.potentialSavings,
    0,
  );
  const reserveStart = Math.max(summary.income * 0.05, 0);

  return [
    {
      horizon: "7 dias" as const,
      title: summary.cashShortfall > 0 ? "Proteger o caixa imediato" : "Definir teto de gasto da semana",
      description: summary.cashShortfall > 0
        ? "Liste vencimentos, pague essenciais primeiro, renegocie o que puder gerar juros e pare novas parcelas até o mês fechar."
        : "Separe um limite semanal para gastos variáveis e acompanhe diariamente até a próxima competência.",
      expectedImpact: immediateImpact,
    },
    {
      horizon: "30 dias" as const,
      title: "Reduzir compromissos recorrentes",
      description: "Cancelar ou renegociar assinaturas, delivery, compras por impulso, tarifas e faturas mais pesadas.",
      expectedImpact: monthlyAdjustment,
    },
    {
      horizon: "90 dias" as const,
      title: summary.projectedBalance < 0 ? "Virar o fluxo para positivo" : "Consolidar reserva mínima",
      description: summary.projectedBalance < 0
        ? "Repetir o corte mensal, evitar parcelamentos novos e direcionar qualquer sobra para dívidas ou faturas críticas."
        : "Automatizar uma reserva inicial e revisar o orçamento por categoria todo mês.",
      expectedImpact: reserveStart,
    },
  ];
}

function buildPlainLanguageAlerts(alerts: AlertItem[], summary: FinancialSummary) {
  const plainAlerts = alerts.map((alert) => `${riskLabel(alert.level)}: ${alert.title}. ${alert.message}`);

  if (summary.projectedBalance < 0) {
    plainAlerts.unshift(`O mês não fecha sozinho: falta ${formatMoney(Math.abs(summary.projectedBalance))} para cobrir todos os compromissos previstos.`);
  }

  if (plainAlerts.length === 0) {
    plainAlerts.push("Nenhum alerta crítico no momento. Continue lançando os dados para manter a leitura confiável.");
  }

  return plainAlerts.slice(0, 6);
}

function buildScoreSuggestions(summary: FinancialSummary) {
  const suggestions: string[] = [];

  if (summary.committedIncomeRatio > 0.7) {
    const targetReduction = Math.max(summary.totalOutflow - summary.income * 0.7, 0);
    suggestions.push(`Reduzir compromissos em pelo menos ${formatMoney(targetReduction)} para voltar ao limite de 70% da renda.`);
  }

  if (summary.cardIncomeRatio > 0.3) {
    const cardTargetReduction = Math.max(summary.cardInvoices - summary.income * 0.3, 0);
    suggestions.push(`Baixar faturas em cerca de ${formatMoney(cardTargetReduction)} para ficar abaixo de 30% da renda.`);
  }

  if (summary.cashShortfall > 0) {
    suggestions.push(`Cobrir ${formatMoney(summary.cashShortfall)} de caixa descoberto antes de assumir novos compromissos.`);
  }

  if (summary.potentialSavings > 0) {
    suggestions.push(`Executar cortes ajustáveis de até ${formatMoney(summary.potentialSavings)} sem mexer no essencial.`);
  }

  if (suggestions.length === 0) {
    suggestions.push("Manter gastos variáveis dentro do teto semanal e aumentar a reserva mensal gradualmente.");
  }

  return suggestions;
}

function buildExecutiveDiagnosis(summary: FinancialSummary, diagnostics: DiagnosticFinding[]) {
  const lead = `${riskLabel(summary.riskLevel)}: ${riskPhrase(summary.riskLevel)}.`;
  const mainFinding = diagnostics[0]?.title
    ? `O principal ponto de atenção é: ${diagnostics[0].title.toLowerCase()}.`
    : "O principal objetivo é manter consistência e evitar crescimento de faturas.";
  const direction = summary.projectedBalance < 0
    ? "A recomendação executiva é reorganizar o fluxo agora, porque o mês fecha negativo se nada mudar."
    : "A recomendação executiva é preservar a sobra e transformar o resultado positivo em reserva ou quitação estratégica.";

  return `${lead} ${mainFinding} ${direction}`;
}

function buildTechnicalDiagnosis(summary: FinancialSummary, debts: Debt[]) {
  const highInterestDebt = debts.find((debt) => debt.interestRateMonth >= 8);

  return [
    {
      label: "Comprometimento da renda",
      value: formatPercent(summary.committedIncomeRatio),
      interpretation: "Mostra quanto da renda prevista já está consumida por despesas, faturas e dívidas da competência.",
    },
    {
      label: "Caixa sem cobertura",
      value: formatMoney(summary.cashShortfall),
      interpretation: "Compara obrigações em aberto com o caixa que sobrou depois do que já foi pago.",
    },
    {
      label: "Peso dos cartões",
      value: formatPercent(summary.cardIncomeRatio),
      interpretation: "Acima de 30%, o cartão começa a disputar espaço com despesas essenciais.",
    },
    {
      label: "Parcelas futuras",
      value: formatMoney(summary.futureInstallmentsTotal),
      interpretation: "Mostra a pressão que já foi empurrada para os próximos meses.",
    },
    {
      label: "Dívida de maior atenção",
      value: highInterestDebt ? highInterestDebt.creditor : "Sem dívida crítica cadastrada",
      interpretation: highInterestDebt
        ? `Juros de ${highInterestDebt.interestRateMonth.toFixed(2)}% ao mês pedem renegociação ou ataque prioritário.`
        : "Nenhuma dívida com juros muito alto foi encontrada na base atual.",
    },
  ];
}

function buildGlossary() {
  return [
    {
      term: "Competência",
      explanation: "É o mês financeiro analisado. Uma conta de maio entra em maio, mesmo que você esteja olhando o sistema em outro dia.",
    },
    {
      term: "Caixa realizado",
      explanation: "É o dinheiro que entrou menos o que já foi pago. Ele mostra a situação real do bolso hoje.",
    },
    {
      term: "Saldo previsto",
      explanation: "É a renda prevista menos todos os compromissos do mês. Mostra como o mês tende a fechar.",
    },
    {
      term: "Comprometimento da renda",
      explanation: "É a parte da renda já ocupada por contas, faturas, parcelas e dívidas.",
    },
    {
      term: "Caixa sem cobertura",
      explanation: "É o valor em aberto que ainda não tem dinheiro realizado suficiente para pagar.",
    },
    {
      term: "Gasto ajustável",
      explanation: "É uma despesa que pode ser reduzida, adiada, renegociada ou cortada sem afetar o básico.",
    },
  ];
}

export function buildFinancialExplanation(input: FinancialExplanationInput): FinancialExplanation {
  const { summary, cards, debts, diagnostics, actions, alerts } = input;

  return {
    simpleMonthSummary: buildSimpleMonthSummary(summary),
    scoreExplanation: buildScoreExplanation(summary),
    commitmentExplanation: buildCommitmentExplanation(summary),
    balanceExplanation: buildBalanceExplanation(summary),
    cardsExplanation: buildCardsExplanation(summary, cards),
    installmentsExplanation: buildInstallmentsExplanation(summary),
    whatToDoFirst: buildWhatToDoFirst(summary, actions),
    horizonPlan: buildHorizonPlan(summary),
    plainLanguageAlerts: buildPlainLanguageAlerts(alerts, summary),
    scoreImprovementSuggestions: buildScoreSuggestions(summary),
    executiveDiagnosis: buildExecutiveDiagnosis(summary, diagnostics),
    technicalDiagnosis: buildTechnicalDiagnosis(summary, debts),
    glossary: buildGlossary(),
  };
}
