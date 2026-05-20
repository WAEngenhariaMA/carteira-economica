import type {
  ActionItem,
  AlertItem,
  BudgetRule,
  Card,
  Debt,
  DiagnosticFinding,
  FinancialProfile,
  FinancialSummary,
  MonthlyCommitment,
  RiskLevel,
  Transaction,
} from "../types/finance";

const monthLabels = ["Mai/26", "Jun/26", "Jul/26", "Ago/26", "Set/26", "Out/26"];

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function riskFromScore(score: number): RiskLevel {
  if (score >= 85) return "excellent";
  if (score >= 70) return "healthy";
  if (score >= 55) return "attention";
  if (score >= 40) return "risk";
  if (score >= 25) return "critical";
  return "emergency";
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
): MonthlyCommitment[] {
  const debtPayments = sum(debts.map((debt) => debt.monthlyPayment));

  return monthLabels.map((month, index) => {
    const cardInstallments = sum(cards.map((card) => card.futureInstallments[index] ?? 0));
    const total = fixedExpenses + cardInstallments + debtPayments;

    return {
      month,
      cardInstallments,
      fixedExpenses,
      debts: debtPayments,
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
): FinancialSummary {
  const income = sum(transactions.filter((item) => item.type === "income").map((item) => item.amount));
  const directExpenses = transactions.filter(
    (item) => item.type === "expense" && item.paymentRail !== "card",
  );
  const directFixedExpenses = sum(directExpenses.filter((item) => item.fixed).map((item) => item.amount));
  const directVariableExpenses = sum(
    directExpenses.filter((item) => !item.fixed).map((item) => item.amount),
  );
  const cardInvoices = sum(cards.map((card) => card.currentInvoice));
  const debtPayments = sum(debts.map((debt) => debt.monthlyPayment));
  const totalOutflow = directFixedExpenses + directVariableExpenses + cardInvoices + debtPayments;
  const projectedBalance = income - totalOutflow;
  const committedIncomeRatio = income > 0 ? totalOutflow / income : 0;
  const cardIncomeRatio = income > 0 ? cardInvoices / income : 0;
  const debtRatio = income > 0 ? (debtPayments + cardInvoices) / income : 0;
  const cardLoadPenalty = clamp(cardIncomeRatio - 0.25, 0, 1) * 26;
  const commitmentPenalty = clamp(committedIncomeRatio - 0.55, 0, 1) * 44;
  const debtPenalty = clamp(debtRatio - 0.3, 0, 1) * 25;
  const reservePenalty = profile.currentReserve < totalOutflow ? 14 : 0;
  const balancePenalty = projectedBalance < 0 ? 18 : 0;
  const healthScore = Math.round(
    clamp(100 - cardLoadPenalty - commitmentPenalty - debtPenalty - reservePenalty - balancePenalty, 0, 100),
  );
  const riskLevel = riskFromScore(healthScore);
  const cardExpenses = transactions.filter((item) => item.type === "expense" && item.paymentRail === "card");
  const potentialSavings = sum(
    cardExpenses
      .filter((item) => item.essentiality === "superfluous" || item.essentiality === "impulsive")
      .map((item) => item.amount * 0.65),
  );

  return {
    income,
    directFixedExpenses,
    directVariableExpenses,
    cardInvoices,
    debtPayments,
    totalOutflow,
    projectedBalance,
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
    futureCommitments: buildFutureCommitments(income, directFixedExpenses, cards, debts),
  };
}

export function buildDiagnostics(summary: FinancialSummary, cards: Card[], debts: Debt[]): DiagnosticFinding[] {
  const findings: DiagnosticFinding[] = [];

  if (summary.committedIncomeRatio > 0.7) {
    findings.push({
      id: "diag-income",
      title: "Renda comprometida acima do limite seguro",
      description:
        "O fluxo mensal está operando em zona de pressão. A prioridade é reduzir faturas e bloquear novas parcelas antes de buscar investimentos.",
      severity: summary.committedIncomeRatio > 0.9 ? "critical" : "risk",
      metric: "Comprometimento",
    });
  }

  if (summary.cardIncomeRatio > 0.3) {
    findings.push({
      id: "diag-card",
      title: "Cartões pesando mais que 30% da renda",
      description:
        "As faturas já consomem uma parcela relevante do caixa. O cartão mais sensível deve receber teto semanal e revisão de compras recorrentes.",
      severity: summary.cardIncomeRatio > 0.55 ? "critical" : "risk",
      metric: "Cartões",
    });
  }

  if (summary.projectedBalance < 0) {
    findings.push({
      id: "diag-balance",
      title: "Saldo mensal projetado negativo",
      description:
        "Mesmo sem novos gastos, o mês tende a fechar no vermelho. A decisão correta é atacar vazamentos de caixa em até 7 dias.",
      severity: "critical",
      metric: "Fluxo",
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

  if (summary.futureCommitments.slice(0, 3).some((month) => month.total / summary.income > 0.45)) {
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

export function categoryTotals(transactions: Transaction[]) {
  const expenseTransactions = transactions.filter((item) => item.type === "expense");
  const totals = expenseTransactions.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + item.amount;
    return acc;
  }, {});

  return Object.entries(totals)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}
