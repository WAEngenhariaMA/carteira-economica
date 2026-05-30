import type {
  ActionItem,
  AlertItem,
  Card,
  Debt,
  DiagnosticFinding,
  FinancialSummary,
  Installment,
  Invoice,
  RiskLevel,
} from "../types/finance";
import { formatMoney, formatPercent, riskLabel } from "./formatters";

export interface FinancialTermExplanation {
  term: string;
  explanation: string;
}

export interface HorizonPlanItem {
  horizon: "Hoje" | "7 dias" | "30 dias" | "90 dias";
  title: string;
  description: string;
  firstStep: string;
  expectedImpact: number;
  scoreImpact: number;
}

export interface PriorityActionExplanation {
  title: string;
  reason: string;
  impact: string;
}

export interface PaymentPriorityItem {
  title: string;
  reason: string;
  action: string;
  estimatedRelief: number;
  urgency: "Imediata" | "Próxima" | "Estratégica";
  caution: string;
}

export interface CardUsageGuidance {
  recommendation: string;
  recommendedLimit: number;
  installmentLimit: number;
  warning: string;
}

export interface TechnicalDiagnosisLine {
  label: string;
  value: string;
  interpretation: string;
}

export interface FinancialExplanation {
  simpleMonthSummary: string;
  scoreExplanation: string;
  scoreDroppedReasons: string[];
  commitmentExplanation: string;
  balanceExplanation: string;
  cardsExplanation: string;
  installmentsExplanation: string;
  whatToDoFirst: PriorityActionExplanation[];
  horizonPlan: HorizonPlanItem[];
  paymentPriorities: PaymentPriorityItem[];
  cardUsageGuidance: CardUsageGuidance;
  plainLanguageAlerts: string[];
  scoreImprovementSuggestions: string[];
  executiveDiagnosis: string;
  technicalDiagnosis: TechnicalDiagnosisLine[];
  glossary: FinancialTermExplanation[];
  plainLanguageConclusion: string;
}

interface FinancialExplanationInput {
  summary: FinancialSummary;
  cards: Card[];
  invoices?: Invoice[];
  installments?: Installment[];
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
  const reasons = buildScoreDroppedReasons(summary).map((reason) => reason.toLowerCase());

  if (reasons.length === 0) {
    return `Sua nota é ${summary.healthScore}/100 porque o fluxo mensal está sob controle e os principais riscos não passaram dos limites técnicos.`;
  }

  return `Sua nota é ${summary.healthScore}/100 porque ${reasons.join(", ")}. Quanto mais esses pontos forem reduzidos, mais rápido o score melhora.`;
}

function buildScoreDroppedReasons(summary: FinancialSummary) {
  if (summary.scoreFactors.length > 0) {
    return summary.scoreFactors.map((factor) => `${factor.label}: ${factor.points} pontos`);
  }

  return ["Nenhuma penalidade relevante encontrada no motor de regras."];
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

function buildPaymentPriorities(
  summary: FinancialSummary,
  cards: Card[],
  invoices: Invoice[] = [],
  installments: Installment[] = [],
  debts: Debt[],
): PaymentPriorityItem[] {
  const priorities: PaymentPriorityItem[] = [];
  const currentInvoices = invoices
    .filter((invoice) => invoice.competence === summary.futureCommitments[0]?.competence)
    .filter((invoice) => invoice.status !== "paid")
    .sort((a, b) => {
      const aOverdue = a.status === "overdue" ? 1 : 0;
      const bOverdue = b.status === "overdue" ? 1 : 0;
      if (aOverdue !== bOverdue) return bOverdue - aOverdue;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

  currentInvoices.slice(0, 2).forEach((invoice, index) => {
    const card = cards.find((item) => item.id === invoice.cardId);
    const openAmount = Math.max(invoice.totalAmount - invoice.paidAmount, 0);
    priorities.push({
      title: `Pagar ${card?.bank ?? "fatura"} ${index === 0 ? "primeiro" : "logo depois"}`,
      reason:
        invoice.status === "overdue"
          ? "Essa fatura já está vencida ou muito crítica para o caixa."
          : `Fatura com vencimento em ${invoice.dueDate} pressionando o mês atual.`,
      action:
        openAmount > 0
          ? `Priorize ${formatMoney(openAmount)} nessa fatura antes de assumir nova compra parcelada.`
          : "Quitar a fatura integralmente para aliviar o risco do cartão.",
      estimatedRelief: openAmount || invoice.totalAmount,
      urgency: index === 0 ? "Imediata" : "Próxima",
      caution:
        "Evite parcelar a própria fatura enquanto houver espaço para corte ou reorganização do fluxo.",
    });
  });

  const highestInterestDebt = [...debts].sort(
    (a, b) => b.interestRateMonth - a.interestRateMonth || b.monthlyPayment - a.monthlyPayment,
  )[0];

  if (highestInterestDebt && highestInterestDebt.interestRateMonth >= 6) {
    priorities.push({
      title: `Negociar ou atacar ${highestInterestDebt.creditor}`,
      reason: `Juros de ${highestInterestDebt.interestRateMonth.toFixed(2)}% ao mês drenam o caixa mais rápido.`,
      action: highestInterestDebt.renegotiable
        ? "Tentar renegociação de prazo ou juros antes de ampliar o uso do cartão."
        : "Direcionar sobra mensal para reduzir essa dívida primeiro.",
      estimatedRelief: highestInterestDebt.monthlyPayment,
      urgency: "Próxima",
      caution: "Não faz sentido investir ou abrir novas parcelas enquanto essa dívida continuar cara.",
    });
  }

  const pendingLoans = installments
    .filter((item) => item.source === "loan")
    .filter((item) => item.competence === summary.futureCommitments[0]?.competence)
    .filter((item) => item.status !== "paid");
  const pendingLoanTotal = pendingLoans.reduce((total, item) => total + item.amount, 0);

  if (pendingLoanTotal > 0) {
    priorities.push({
      title: "Reservar caixa para parcelas de empréstimo",
      reason: "Essas parcelas não desaparecem e continuam pressionando os próximos vencimentos.",
      action: `Separar pelo menos ${formatMoney(pendingLoanTotal)} para não deixar empréstimo competir com conta essencial.`,
      estimatedRelief: pendingLoanTotal,
      urgency: priorities.length === 0 ? "Imediata" : "Próxima",
      caution: "Empréstimo atrasado costuma piorar score e reduzir margem de negociação.",
    });
  }

  if (priorities.length === 0) {
    priorities.push({
      title: "Manter pagamentos essenciais organizados",
      reason: "Não apareceu um ponto crítico isolado na base atual.",
      action: "Pague essenciais e faturas na ordem de vencimento, preservando o saldo positivo do mês.",
      estimatedRelief: 0,
      urgency: "Estratégica",
      caution: "Mesmo em cenário estável, evite empurrar compras para meses futuros sem necessidade.",
    });
  }

  return priorities.slice(0, 4);
}

function buildCardUsageGuidance(summary: FinancialSummary, cards: Card[]): CardUsageGuidance {
  const topCard = highestCardRisk(cards);
  if (summary.projectedBalance < 0 || summary.cardIncomeRatio > 0.3) {
    return {
      recommendation:
        "Não usar cartão para novas compras até reorganizar o mês atual.",
      recommendedLimit: 0,
      installmentLimit: 0,
      warning:
        topCard
          ? `${topCard.bank} já está sensível. Nova parcela aumenta o risco de rolagem e aperto.`
          : "Com saldo projetado negativo, novas compras no cartão pioram o fluxo.",
    };
  }

  const recommendedLimit = Math.max(
    Math.min(summary.projectedBalance * 0.35, summary.safeWeeklySpend * 2),
    0,
  );
  const installmentLimit = recommendedLimit > 0 ? Math.min(3, 2) : 0;

  return {
    recommendation:
      recommendedLimit > 0
        ? `Se precisar usar cartão, mantenha até ${formatMoney(recommendedLimit)} e prefira à vista ou em até ${installmentLimit}x.`
        : "Evite novo uso do cartão nesta competência.",
    recommendedLimit,
    installmentLimit,
    warning:
      topCard
        ? `O cartão mais sensível hoje é ${topCard.bank}; se usar crédito, não concentre novas compras nele.`
        : "Use crédito só se houver espaço real no saldo previsto.",
  };
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
      horizon: "Hoje" as const,
      title: summary.urgentAmount > 0 ? "Resolver o valor sem cobertura" : "Proteger o controle do dia",
      description: summary.urgentAmount > 0
        ? "Antes de qualquer nova compra, descubra de onde virá a cobertura do valor faltante: corte, adiamento, renegociação ou entrada confirmada."
        : "Manter o dia sem novas parcelas e revisar se todos os lançamentos do mês estão cadastrados.",
      firstStep: summary.urgentAmount > 0
        ? "Anotar o valor faltante e separar as contas que vencem primeiro."
        : "Conferir receitas, despesas, faturas e parcelas do mês selecionado.",
      expectedImpact: summary.urgentAmount,
      scoreImpact: summary.urgentAmount > 0 ? 12 : 3,
    },
    {
      horizon: "7 dias" as const,
      title: summary.cashShortfall > 0 ? "Proteger o caixa imediato" : "Definir teto de gasto da semana",
      description: summary.cashShortfall > 0
        ? "Liste vencimentos, pague essenciais primeiro, renegocie o que puder gerar juros e pare novas parcelas até o mês fechar."
        : "Separe um limite semanal para gastos variáveis e acompanhe diariamente até a próxima competência.",
      firstStep: summary.cashShortfall > 0
        ? "Montar ordem de pagamento por vencimento, juros e essencialidade."
        : "Definir o valor semanal seguro no painel e acompanhar gastos variáveis.",
      expectedImpact: immediateImpact,
      scoreImpact: summary.cashShortfall > 0 ? 10 : 4,
    },
    {
      horizon: "30 dias" as const,
      title: "Reduzir compromissos recorrentes",
      description: "Cancelar ou renegociar assinaturas, delivery, compras por impulso, tarifas e faturas mais pesadas.",
      firstStep: "Ordenar categorias e subcategorias por valor; começar pelo maior gasto ajustável.",
      expectedImpact: monthlyAdjustment,
      scoreImpact: 7,
    },
    {
      horizon: "90 dias" as const,
      title: summary.projectedBalance < 0 ? "Virar o fluxo para positivo" : "Consolidar reserva mínima",
      description: summary.projectedBalance < 0
        ? "Repetir o corte mensal, evitar parcelamentos novos e direcionar qualquer sobra para dívidas ou faturas críticas."
        : "Automatizar uma reserva inicial e revisar o orçamento por categoria todo mês.",
      firstStep: summary.projectedBalance < 0
        ? "Definir uma meta mensal de redução até o saldo ficar positivo."
        : "Escolher reserva mínima de 3 meses e automatizar o primeiro aporte.",
      expectedImpact: reserveStart,
      scoreImpact: 8,
    },
  ];
}

function buildPlainLanguageAlerts(alerts: AlertItem[], summary: FinancialSummary) {
  const plainAlerts = alerts.map((alert) => {
    const action = alert.recommendedAction ? ` Ação recomendada: ${alert.recommendedAction}` : "";
    const risk = alert.ignoredRisk ? ` Se ignorar: ${alert.ignoredRisk}` : "";
    return `${riskLabel(alert.level)}: ${alert.title}. ${alert.simpleExplanation ?? alert.message}${risk}${action}`;
  });

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

  if (summary.dataQualityIssues.length > 0) {
    suggestions.push("Corrigir dados incompletos para aumentar a confiança do diagnóstico e evitar decisão com número distorcido.");
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
      label: "Gasto diário seguro",
      value: formatMoney(summary.safeDailySpend),
      interpretation: "Mostra quanto pode gastar por dia sem piorar o saldo previsto do mês.",
    },
    {
      label: "Reserva recomendada",
      value: formatMoney(summary.reserveTargets.selectedTarget),
      interpretation: summary.reserveTargets.explanation,
    },
    {
      label: "Renda ideal automática",
      value: formatMoney(summary.automaticIdealIncome.amount),
      interpretation: summary.automaticIdealIncome.explanation,
    },
    {
      label: "Confiabilidade dos dados",
      value: `${summary.dataQualityScore}/100`,
      interpretation: summary.dataReliabilityLabel,
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

function buildPlainLanguageConclusion(summary: FinancialSummary) {
  if (summary.projectedBalance < 0) {
    return `Conclusão: o mês não fecha sozinho. A primeira decisão deve ser resolver ${formatMoney(Math.abs(summary.projectedBalance))}, evitando novas parcelas e priorizando contas essenciais, faturas críticas e dívidas com juros.`;
  }

  if (summary.riskLevel === "attention" || summary.riskLevel === "risk") {
    return "Conclusão: o mês ainda pode fechar, mas a margem está apertada. O caminho mais seguro é controlar gasto semanal, evitar cartão e reforçar reserva antes de ampliar consumo.";
  }

  return "Conclusão: a situação está administrável. Mantenha rotina de revisão, preserve a sobra e direcione parte do caixa para reserva, dívida estratégica ou objetivo principal.";
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
  const {
    summary,
    cards,
    invoices = [],
    installments = [],
    debts,
    diagnostics,
    actions,
    alerts,
  } = input;

  return {
    simpleMonthSummary: buildSimpleMonthSummary(summary),
    scoreExplanation: buildScoreExplanation(summary),
    scoreDroppedReasons: buildScoreDroppedReasons(summary),
    commitmentExplanation: buildCommitmentExplanation(summary),
    balanceExplanation: buildBalanceExplanation(summary),
    cardsExplanation: buildCardsExplanation(summary, cards),
    installmentsExplanation: buildInstallmentsExplanation(summary),
    whatToDoFirst: buildWhatToDoFirst(summary, actions),
    horizonPlan: buildHorizonPlan(summary),
    paymentPriorities: buildPaymentPriorities(
      summary,
      cards,
      invoices,
      installments,
      debts,
    ),
    cardUsageGuidance: buildCardUsageGuidance(summary, cards),
    plainLanguageAlerts: buildPlainLanguageAlerts(alerts, summary),
    scoreImprovementSuggestions: buildScoreSuggestions(summary),
    executiveDiagnosis: buildExecutiveDiagnosis(summary, diagnostics),
    technicalDiagnosis: buildTechnicalDiagnosis(summary, debts),
    glossary: buildGlossary(),
    plainLanguageConclusion: buildPlainLanguageConclusion(summary),
  };
}
