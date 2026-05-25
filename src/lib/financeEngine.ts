import type {
  ActionItem,
  AlertItem,
  BudgetRule,
  Card,
  Debt,
  DiagnosticFinding,
  FinancialProfile,
  FinancialSummary,
  Installment,
  Invoice,
  MonthlyCommitment,
  RiskLevel,
  Transaction,
} from "../types/finance";
import { currentCompetence, nextCompetences } from "../services/dateService";

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function monthLabel(competence: string) {
  const [year, month] = competence.split("-").map(Number);
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  return `${months[month - 1] ?? "Mês"}/${String(year).slice(-2)}`;
}

function isLoanInstallment(installment: Installment) {
  return installment.source === "loan" || !installment.cardId;
}

export function transactionBelongsToCompetence(transaction: Transaction, competence: string) {
  const dateCompetence = transaction.date?.slice(0, 7);

  if (transaction.projectedFromRecurring) return transaction.competence === competence;
  return transaction.competence === competence && (!dateCompetence || dateCompetence === competence);
}

function riskFromScore(score: number): RiskLevel {
  if (score >= 85) return "excellent";
  if (score >= 70) return "healthy";
  if (score >= 55) return "attention";
  if (score >= 40) return "risk";
  return "critical";
}

function statusFromRisk(level: RiskLevel) {
  const status: Record<RiskLevel, string> = {
    excellent: "Excelente",
    healthy: "Saudável",
    attention: "Atenção operacional",
    risk: "Risco de aperto",
    critical: "Crítico",
    emergency: "Emergência financeira",
  };

  return status[level];
}

function adaptiveBudgetFor(score: number): BudgetRule {
  if (score >= 70) {
    return { needs: 0.5, wants: 0.3, reserveOrDebt: 0.2, label: "50/30/20 saudável" };
  }

  if (score >= 50) {
    return { needs: 0.6, wants: 0.25, reserveOrDebt: 0.15, label: "60/25/15 apertado" };
  }

  if (score >= 30) {
    return { needs: 0.7, wants: 0.1, reserveOrDebt: 0.2, label: "70/10/20 endividado" };
  }

  return { needs: 0.8, wants: 0.05, reserveOrDebt: 0.15, label: "80/5/15 emergência" };
}

function buildFutureCommitments(
  income: number,
  fixedExpenses: number,
  cards: Card[],
  debts: Debt[],
  installments: Installment[],
  baseCompetence: string,
): MonthlyCommitment[] {
  const debtPayments = sum(debts.map((debt) => debt.monthlyPayment));
  const competences = nextCompetences(baseCompetence, 6);

  return competences.map((competence, index) => {
    const cardInstallments = sum(cards.map((card) => card.futureInstallments[index] ?? 0));
    const loanInstallments = sum(
      installments
        .filter(
          (installment) =>
            installment.competence === competence
            && isLoanInstallment(installment)
            && (index === 0 || installment.status !== "paid"),
        )
        .map((installment) => installment.amount),
    );
    const total = fixedExpenses + cardInstallments + debtPayments + loanInstallments;

    return {
      month: monthLabel(competence),
      cardInstallments,
      fixedExpenses,
      debts: debtPayments,
      loanInstallments,
      total,
      projectedBalance: income - total,
    };
  });
}

export function buildFinancialSummary(
  profile: FinancialProfile,
  transactions: Transaction[],
  cards: Card[],
  debts: Debt[],
  installments: Installment[] = [],
  competence = transactions[0]?.competence ?? currentCompetence(),
  invoices: Invoice[] = [],
): FinancialSummary {
  const monthlyTransactions = transactions.filter((item) => transactionBelongsToCompetence(item, competence));
  const incomeTransactions = monthlyTransactions.filter((item) => item.type === "income");
  const confirmedIncome = sum(incomeTransactions.filter((item) => item.status === "paid").map((item) => item.amount));
  const pendingIncome = sum(incomeTransactions.filter((item) => item.status !== "paid").map((item) => item.amount));
  const expectedIncome = confirmedIncome + pendingIncome;
  const income = expectedIncome;
  const directExpenses = monthlyTransactions.filter(
    (item) => item.type === "expense" && item.paymentRail !== "card",
  );
  const directFixedExpenses = sum(directExpenses.filter((item) => item.fixed).map((item) => item.amount));
  const directVariableExpenses = sum(
    directExpenses.filter((item) => !item.fixed).map((item) => item.amount),
  );
  const paidDirectExpenses = sum(directExpenses.filter((item) => item.status === "paid").map((item) => item.amount));
  const pendingDirectExpenses = sum(directExpenses.filter((item) => item.status !== "paid").map((item) => item.amount));
  const cardsWithInvoiceRows = new Set(invoices.map((invoice) => invoice.cardId));
  const fallbackCardInvoices = sum(
    cards
      .filter((card) => !cardsWithInvoiceRows.has(card.id))
      .map((card) => card.currentInvoice),
  );
  const paidCardInvoices = sum(
    invoices
      .filter((invoice) => invoice.competence === competence && invoice.status === "paid")
      .map((invoice) => invoice.totalAmount),
  );
  const openCardInvoices = fallbackCardInvoices + sum(
    invoices
      .filter((invoice) => invoice.competence === competence && invoice.status !== "paid")
      .map((invoice) => invoice.totalAmount),
  );
  const cardInvoices = paidCardInvoices + openCardInvoices;
  const currentLoanInstallmentsRows = installments.filter(
    (installment) => installment.competence === competence && isLoanInstallment(installment),
  );
  const currentLoanInstallments = sum(currentLoanInstallmentsRows.map((installment) => installment.amount));
  const pendingLoanInstallments = sum(
    currentLoanInstallmentsRows
      .filter((installment) => installment.status !== "paid")
      .map((installment) => installment.amount),
  );
  const paidLoanInstallments = sum(
    currentLoanInstallmentsRows
      .filter((installment) => installment.status === "paid")
      .map((installment) => installment.amount),
  );
  const debtMonthlyPayments = sum(debts.map((debt) => debt.monthlyPayment));
  const debtPayments = debtMonthlyPayments + currentLoanInstallments;
  const totalOutflow = directFixedExpenses + directVariableExpenses + cardInvoices + debtPayments;
  const projectedBalance = income - totalOutflow;
  const realizedBalance = confirmedIncome - paidDirectExpenses - paidCardInvoices - paidLoanInstallments;
  const monthlyOpenObligations = pendingDirectExpenses + openCardInvoices + debtMonthlyPayments + pendingLoanInstallments;
  const immediateObligations = monthlyOpenObligations;
  const cashShortfall = Math.max(monthlyOpenObligations - confirmedIncome, 0);
  const futureCommitments = buildFutureCommitments(income, directFixedExpenses, cards, debts, installments, competence);
  const futureCommitmentRows = futureCommitments.slice(1);
  const nextMonthCommitment = futureCommitmentRows[0]?.total ?? 0;
  const futureCommitmentsTotal = sum(futureCommitmentRows.map((month) => month.total));
  const futureInstallmentsTotal = sum(
    futureCommitmentRows.map((month) => month.cardInstallments + month.loanInstallments),
  );
  const pendingIncomeRatio = income > 0 ? pendingIncome / income : 0;
  const pendingExpenseRatio = totalOutflow > 0 ? pendingDirectExpenses / totalOutflow : 0;
  const committedIncomeRatio = income > 0 ? totalOutflow / income : 0;
  const cardIncomeRatio = income > 0 ? cardInvoices / income : 0;
  const debtRatio = income > 0 ? (debtPayments + cardInvoices) / income : 0;
  const cardLoadPenalty = clamp(cardIncomeRatio - 0.25, 0, 1) * 26;
  const commitmentPenalty = clamp(committedIncomeRatio - 0.55, 0, 1) * 44;
  const debtPenalty = clamp(debtRatio - 0.3, 0, 1) * 25;
  const receivablePenalty = clamp(pendingIncomeRatio - 0.25, 0, 1) * 12;
  const cashPenalty = cashShortfall > 0 ? clamp(cashShortfall / Math.max(income, 1), 0, 1) * 16 : 0;
  const reservePenalty = profile.currentReserve < totalOutflow ? 14 : 0;
  const balancePenalty = projectedBalance < 0 ? 18 : 0;
  const healthScore = Math.round(
    clamp(
      100 - cardLoadPenalty - commitmentPenalty - debtPenalty - receivablePenalty - cashPenalty - reservePenalty - balancePenalty,
      0,
      100,
    ),
  );
  const riskLevel = riskFromScore(healthScore);
  const potentialSavings = sum(
    monthlyTransactions
      .filter((item) => item.type === "expense")
      .filter((item) => item.essentiality === "superfluous" || item.essentiality === "impulsive")
      .map((item) => item.amount * 0.65),
  );

  return {
    income,
    confirmedIncome,
    pendingIncome,
    expectedIncome,
    directFixedExpenses,
    directVariableExpenses,
    paidDirectExpenses,
    pendingDirectExpenses,
    cardInvoices,
    openCardInvoices,
    paidCardInvoices,
    debtPayments,
    totalOutflow,
    projectedBalance,
    realizedBalance,
    immediateObligations,
    monthlyOpenObligations,
    nextMonthCommitment,
    futureCommitmentsTotal,
    futureInstallmentsTotal,
    cashShortfall,
    pendingIncomeRatio,
    pendingExpenseRatio,
    committedIncomeRatio,
    cardIncomeRatio,
    debtRatio,
    savingsCapacity: income > 0 ? projectedBalance / income : 0,
    potentialSavings,
    dailyAverageSpend: totalOutflow / 30,
    weeklyAverageSpend: totalOutflow / 4.345,
    freeUntilMonthEnd: projectedBalance - 950,
    healthScore,
    riskLevel,
    financialStatus: statusFromRisk(riskLevel),
    adaptiveBudget: adaptiveBudgetFor(healthScore),
    futureCommitments,
  };
}

export function buildDiagnostics(summary: FinancialSummary, cards: Card[], debts: Debt[]): DiagnosticFinding[] {
  const findings: DiagnosticFinding[] = [];

  if (summary.committedIncomeRatio > 0.7) {
    findings.push({
      id: "diag-income",
      title: "Renda comprometida acima do limite seguro",
      description:
        "A competência selecionada está operando em zona de pressão. A prioridade é reduzir faturas do mês, contas abertas e novas parcelas antes de buscar investimentos.",
      severity: summary.committedIncomeRatio > 0.9 ? "critical" : "risk",
      metric: "Comprometimento",
    });
  }

  if (summary.cardIncomeRatio > 0.3) {
    findings.push({
      id: "diag-card",
      title: "Faturas do mês pesando mais que 30% da renda",
      description:
        "As faturas da competência consomem uma parcela relevante do caixa. O cartão mais sensível deve receber teto semanal e revisão de compras recorrentes.",
      severity: summary.cardIncomeRatio > 0.55 ? "critical" : "risk",
      metric: "Cartões",
    });
  }

  if (summary.projectedBalance < 0) {
    findings.push({
      id: "diag-balance",
      title: "Saldo mensal projetado negativo",
      description:
        "Mesmo sem novos gastos na competência selecionada, o mês tende a fechar no vermelho. A decisão correta é atacar vazamentos de caixa em até 7 dias.",
      severity: "critical",
      metric: "Fluxo",
    });
  }

  if (summary.pendingIncome > 0 && summary.pendingIncomeRatio > 0.25) {
    findings.push({
      id: "diag-receivables",
      title: "Receitas pendentes sustentam parte relevante do mês",
      description:
        "Uma fatia importante da renda ainda não entrou no caixa. A recomendação gerencial é separar o orçamento em cenário confirmado e cenário previsto antes de liberar gastos variáveis.",
      severity: summary.pendingIncomeRatio > 0.45 ? "risk" : "attention",
      metric: "Recebíveis",
    });
  }

  if (summary.monthlyOpenObligations > 0 && summary.cashShortfall > 0) {
    findings.push({
      id: "diag-payables",
      title: "Obrigações pendentes acima do caixa confirmado",
      description:
        `Há ${summary.cashShortfall.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 })} em aberto no mês sem cobertura por receita já recebida. Priorize vencimentos, juros e serviços essenciais antes de novos compromissos.`,
      severity: summary.cashShortfall > summary.income * 0.25 ? "critical" : "risk",
      metric: "Contas a pagar",
    });
  }

  if (summary.realizedBalance < 0) {
    findings.push({
      id: "diag-realized-cash",
      title: "Caixa realizado negativo",
      description:
        "O dinheiro efetivamente recebido não cobre o que já foi pago. Isso indica dependência de entradas futuras ou uso de crédito para fechar o mês.",
      severity: "critical",
      metric: "Caixa realizado",
    });
  }

  const highestInterestDebt = debts.find((debt) => debt.interestRateMonth >= 8);
  if (highestInterestDebt) {
    findings.push({
      id: "diag-debt",
      title: "Dívida de juros alto exige ataque prioritário",
      description: `${highestInterestDebt.creditor} tem custo mensal superior ao aceitável. Renegociar ou quitar reduz o risco de bola de neve.`,
      severity: "risk",
      metric: "Dívidas",
    });
  }

  const riskiestCard = [...cards].sort(
    (a, b) => b.currentInvoice / b.limit - a.currentInvoice / a.limit,
  )[0];
  if (riskiestCard && riskiestCard.currentInvoice / riskiestCard.limit > 0.3) {
    findings.push({
      id: "diag-card-limit",
      title: `${riskiestCard.bank} concentra risco de fatura`,
      description:
        "A combinação de fatura alta, limite usado e parcelas futuras aumenta o risco de atraso nos próximos vencimentos.",
      severity: "attention",
      metric: "Fatura",
    });
  }

  return findings;
}

export function buildAlerts(summary: FinancialSummary, cards: Card[]): AlertItem[] {
  const alerts: AlertItem[] = [];

  if (summary.freeUntilMonthEnd < 0) {
    alerts.push({
      id: "alert-cash",
      title: "Saldo livre insuficiente",
      message: "O valor livre até o fim do mês está negativo após reservas operacionais.",
      level: "critical",
      source: "cashflow",
    });
  }

  if (summary.cashShortfall > 0) {
    alerts.push({
      id: "alert-confirmed-cash",
      title: "Caixa confirmado insuficiente",
      message: "As obrigações em aberto da competência superam o dinheiro já recebido no mês.",
      level: summary.cashShortfall > summary.income * 0.25 ? "critical" : "risk",
      source: "cashflow",
    });
  }

  if (summary.pendingIncomeRatio > 0.35) {
    alerts.push({
      id: "alert-pending-income",
      title: "Receita pendente relevante",
      message: "Parte importante do orçamento ainda depende de recebimentos não confirmados.",
      level: "attention",
      source: "cashflow",
    });
  }

  cards.forEach((card) => {
    const invoiceRatio = card.currentInvoice / card.limit;
    if (invoiceRatio > 0.35) {
      alerts.push({
        id: `alert-${card.id}`,
        title: `Fatura ${card.bank} em zona de atenção`,
        message: `Uso atual de ${Math.round(invoiceRatio * 100)}% do limite com vencimento no dia ${card.dueDay}.`,
        level: invoiceRatio > 0.5 ? "risk" : "attention",
        source: "card",
      });
    }
  });

  if (summary.income > 0 && summary.futureCommitments.slice(1, 4).some((month) => month.total / summary.income > 0.45)) {
    alerts.push({
      id: "alert-installments",
      title: "Próximos 3 meses já estão comprometidos",
      message: "Parcelas futuras mantêm pressão mesmo com congelamento imediato de novas compras.",
      level: "risk",
      source: "installments",
    });
  }

  return alerts;
}

export function buildScenario(summary: FinancialSummary, monthlyCut: number, incomeIncrease: number) {
  const adjustedIncome = summary.income + incomeIncrease;
  const adjustedOutflow = Math.max(summary.totalOutflow - monthlyCut, 0);
  const adjustedBalance = adjustedIncome - adjustedOutflow;
  const adjustedCommitment = adjustedIncome > 0 ? adjustedOutflow / adjustedIncome : 0;
  const scoreGain = Math.round(monthlyCut / 120 + incomeIncrease / 200);

  return {
    adjustedIncome,
    adjustedOutflow,
    adjustedBalance,
    adjustedCommitment,
    adjustedScore: clamp(summary.healthScore + scoreGain, 0, 100),
    recoveryMonths: adjustedBalance > 0 ? Math.ceil(1800 / adjustedBalance) : 99,
  };
}

export function buildRuleBasedActions(summary: FinancialSummary): ActionItem[] {
  const actions: ActionItem[] = [];

  if (summary.pendingIncome > 0) {
    actions.push({
      id: "rule-confirm-income",
      title: "Confirmar recebimentos pendentes",
      reason: "O plano do mês depende de receitas ainda não recebidas. Confirme datas, responsáveis e risco de atraso antes de liberar despesas variáveis.",
      priority: summary.pendingIncomeRatio > 0.35 ? "urgent" : "high",
      horizon: "7 dias",
      expectedSavings: Math.round(summary.pendingIncome),
      difficulty: "baixa",
      status: "planned",
    });
  }

  if (summary.cashShortfall > 0) {
    actions.push({
      id: "rule-cash-coverage",
      title: "Montar ordem de pagamento por prioridade",
      reason: "As obrigações abertas do mês superam o caixa confirmado. Pague primeiro essenciais e juros altos, renegocie o restante e evite novas compras.",
      priority: "urgent",
      horizon: "7 dias",
      expectedSavings: Math.round(summary.cashShortfall),
      difficulty: "media",
      status: "planned",
    });
  }

  if (summary.cardIncomeRatio > 0.3) {
    actions.push({
      id: "rule-card-freeze",
      title: "Congelar novas compras parceladas",
      reason: "Cartões acima de 30% da renda elevam o risco de atraso e rolagem.",
      priority: "urgent",
      horizon: "7 dias",
      expectedSavings: Math.round(summary.cardInvoices * 0.18),
      difficulty: "media",
      status: "planned",
    });
  }

  if (summary.potentialSavings > 0) {
    actions.push({
      id: "rule-cut-variable",
      title: "Cortar gastos ajustáveis de maior recorrência",
      reason: "Há economia potencial sem tocar em gastos essenciais.",
      priority: "high",
      horizon: "30 dias",
      expectedSavings: Math.round(summary.potentialSavings),
      difficulty: "media",
      status: "planned",
    });
  }

  if (summary.projectedBalance < 0) {
    actions.push({
      id: "rule-cashflow",
      title: "Reorganizar fluxo de caixa do mês atual",
      reason: "Saldo projetado negativo exige ação antes dos vencimentos.",
      priority: "urgent",
      horizon: "7 dias",
      expectedSavings: Math.abs(Math.round(summary.projectedBalance)),
      difficulty: "alta",
      status: "planned",
    });
  }

  if (actions.length === 0) {
    actions.push({
      id: "rule-reserve",
      title: "Automatizar reserva mensal",
      reason: "Com fluxo sob controle, a próxima decisão é aumentar resiliência.",
      priority: "medium",
      horizon: "90 dias",
      expectedSavings: Math.max(Math.round(summary.income * 0.05), 0),
      difficulty: "baixa",
      status: "planned",
    });
  }

  return actions;
}

export function categoryTotals(transactions: Transaction[], competence?: string) {
  const scopedTransactions = competence
    ? transactions.filter((item) => transactionBelongsToCompetence(item, competence))
    : transactions;
  const expenseTransactions = scopedTransactions.filter((item) => item.type === "expense");
  const totals = expenseTransactions.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + item.amount;
    return acc;
  }, {});

  return Object.entries(totals)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}
