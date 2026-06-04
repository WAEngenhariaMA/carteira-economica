import type {
  ActionItem,
  AlertItem,
  BudgetRule,
  Card,
  DataQualityIssue,
  Debt,
  DiagnosticFinding,
  FinancialHighlight,
  FinancialProfile,
  FinancialSummary,
  Installment,
  Invoice,
  MonthlyCommitment,
  RiskLevel,
  ScoreFactor,
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
  const months = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];

  return `${months[month - 1] ?? "Mês"}/${String(year).slice(-2)}`;
}

function isLoanInstallment(installment: Installment) {
  return installment.source === "loan" || !installment.cardId;
}

function isPaidTransaction(transaction: Transaction) {
  return transaction.status === "paid";
}

function isProjectableTransaction(transaction: Transaction) {
  return (
    transaction.recurring ||
    transaction.fixed ||
    transaction.projectedFromRecurring
  );
}

export function transactionBelongsToCompetence(
  transaction: Transaction,
  competence: string,
) {
  const dateCompetence = transaction.date?.slice(0, 7);

  if (transaction.projectedFromRecurring)
    return transaction.competence === competence;
  return (
    transaction.competence === competence &&
    (!dateCompetence || dateCompetence === competence)
  );
}

export function invoiceBelongsToCompetence(
  invoice: Invoice,
  competence: string,
) {
  return (invoice.dueDate?.slice(0, 7) || invoice.competence) === competence;
}

function riskFromScore(score: number): RiskLevel {
  if (score >= 85) return "excellent";
  if (score >= 70) return "healthy";
  if (score >= 55) return "attention";
  if (score >= 40) return "risk";
  if (score < 20) return "emergency";
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
    return {
      needs: 0.5,
      wants: 0.3,
      reserveOrDebt: 0.2,
      label: "50/30/20 saudável",
      explanation:
        "A renda cobre os compromissos e permite equilibrar necessidades, desejos e formação de reserva.",
    };
  }

  if (score >= 50) {
    return {
      needs: 0.6,
      wants: 0.25,
      reserveOrDebt: 0.15,
      label: "60/25/15 atenção",
      explanation:
        "A margem está menor; por isso o sistema reduz desejos e aumenta disciplina de reserva ou ajuste.",
    };
  }

  if (score >= 30) {
    return {
      needs: 0.7,
      wants: 0.1,
      reserveOrDebt: 0.2,
      label: "70/10/20 recuperação",
      explanation:
        "Como há pressão financeira, o foco temporário é proteger o básico, reduzir desejos e atacar dívidas ou faturas.",
    };
  }

  return {
    needs: 0.8,
    wants: 0.05,
    reserveOrDebt: 0.15,
    label: "80/5/15 emergência",
    explanation:
      "Como a situação exige recuperação imediata, o sistema recomenda cortar desejos, congelar parcelas e priorizar caixa.",
  };
}

interface MonthlyProjectionInput {
  monthlyTransactions: Transaction[];
  cards: Card[];
  debts: Debt[];
  installments: Installment[];
  baseCompetence: string;
  currentCardInvoices: number;
  referenceMonthlyIncome: number;
  programmedInvestments?: number;
  programmedReserve?: number;
}

function buildFutureCommitments({
  monthlyTransactions,
  cards,
  debts,
  installments,
  baseCompetence,
  currentCardInvoices,
  referenceMonthlyIncome,
  programmedInvestments = 0,
  programmedReserve = 0,
}: MonthlyProjectionInput): MonthlyCommitment[] {
  const debtPayments = sum(debts.map((debt) => debt.monthlyPayment));
  const competences = nextCompetences(baseCompetence, 6);
  const currentIncomeTransactions = monthlyTransactions.filter(
    (item) => item.type === "income",
  );
  const currentDirectExpenses = monthlyTransactions.filter(
    (item) => item.type === "expense" && item.paymentRail !== "card",
  );
  const recurringIncomeTransactions = currentIncomeTransactions.filter(
    isProjectableTransaction,
  );
  const recurringDirectExpenses = currentDirectExpenses.filter(
    isProjectableTransaction,
  );
  const fallbackProjectedIncome = referenceMonthlyIncome;

  return competences.map((competence, index) => {
    const isSelectedCompetence = index === 0;
    const incomeRows = isSelectedCompetence
      ? currentIncomeTransactions
      : recurringIncomeTransactions;
    const projectedRecurringIncome =
      sum(incomeRows.map((item) => item.amount)) || fallbackProjectedIncome;
    const receivedIncome = isSelectedCompetence
      ? sum(incomeRows.filter(isPaidTransaction).map((item) => item.amount))
      : 0;
    const pendingIncome = isSelectedCompetence
      ? sum(
          incomeRows
            .filter((item) => !isPaidTransaction(item))
            .map((item) => item.amount),
        )
      : projectedRecurringIncome;
    const expectedIncome = receivedIncome + pendingIncome;
    const directExpenseRows = isSelectedCompetence
      ? currentDirectExpenses
      : recurringDirectExpenses;
    const paidFixedExpenses = isSelectedCompetence
      ? sum(
          directExpenseRows
            .filter((item) => item.fixed && isPaidTransaction(item))
            .map((item) => item.amount),
        )
      : 0;
    const openFixedExpenses = isSelectedCompetence
      ? sum(
          directExpenseRows
            .filter((item) => item.fixed && !isPaidTransaction(item))
            .map((item) => item.amount),
        )
      : sum(
          directExpenseRows
            .filter((item) => item.fixed)
            .map((item) => item.amount),
        );
    const paidVariableExpenses = isSelectedCompetence
      ? sum(
          directExpenseRows
            .filter((item) => !item.fixed && isPaidTransaction(item))
            .map((item) => item.amount),
        )
      : 0;
    const openVariableExpenses = isSelectedCompetence
      ? sum(
          directExpenseRows
            .filter((item) => !item.fixed && !isPaidTransaction(item))
            .map((item) => item.amount),
        )
      : sum(
          directExpenseRows
            .filter((item) => !item.fixed)
            .map((item) => item.amount),
        );
    const fixedExpenses = paidFixedExpenses + openFixedExpenses;
    const variableExpenses = paidVariableExpenses + openVariableExpenses;
    const cardInvoices = isSelectedCompetence
      ? currentCardInvoices
      : sum(cards.map((card) => card.futureInstallments[index] ?? 0));
    const scheduledCardInstallments = sum(
      installments
        .filter(
          (installment) =>
            installment.competence === competence &&
            !isLoanInstallment(installment) &&
            (isSelectedCompetence || installment.status !== "paid"),
        )
        .map((installment) => installment.amount),
    );
    const nonInvoicedCardInstallments =
      cardInvoices > 0 ? 0 : scheduledCardInstallments;
    const loanInstallments = sum(
      installments
        .filter(
          (installment) =>
            installment.competence === competence &&
            isLoanInstallment(installment) &&
            (isSelectedCompetence || installment.status !== "paid"),
        )
        .map((installment) => installment.amount),
    );
    const mandatoryCommitments =
      fixedExpenses +
      variableExpenses +
      debtPayments +
      loanInstallments +
      programmedInvestments +
      programmedReserve;
    const total =
      mandatoryCommitments + cardInvoices + nonInvoicedCardInstallments;

    return {
      month: monthLabel(competence),
      competence,
      receivedIncome,
      pendingIncome,
      expectedIncome,
      paidFixedExpenses,
      openFixedExpenses,
      paidVariableExpenses,
      openVariableExpenses,
      variableExpenses,
      cardInvoices,
      cardInstallments: scheduledCardInstallments,
      nonInvoicedCardInstallments,
      fixedExpenses,
      debts: debtPayments,
      loanInstallments,
      programmedInvestments,
      programmedReserve,
      mandatoryCommitments,
      total,
      projectedBalance: expectedIncome - total,
    };
  });
}

function buildDataQualityIssues({
  profile,
  transactions,
  invoices,
  installments,
  cards,
  debts,
  competence,
}: {
  profile: FinancialProfile;
  transactions: Transaction[];
  invoices: Invoice[];
  installments: Installment[];
  cards: Card[];
  debts: Debt[];
  competence: string;
}): DataQualityIssue[] {
  const issues: DataQualityIssue[] = [];

  if (!profile.ownerName.trim()) {
    issues.push({
      id: "quality-profile-owner",
      source: "profile",
      field: "ownerName",
      message: "Nome do responsável não informado.",
      severity: "error",
      impact: "Relatórios e diagnósticos ficam sem identificação mínima.",
    });
  }

  transactions.forEach((transaction) => {
    const prefix = `${transaction.id}-${transaction.description}`;

    if (!transaction.category || transaction.category === "Sem categoria") {
      issues.push({
        id: `quality-category-${transaction.id}`,
        source: "transaction",
        entityId: transaction.id,
        field: "category",
        message: `${prefix}: lançamento sem categoria.`,
        severity: "warning",
        impact:
          "Categorias pesadas, cortes e importação inteligente ficam menos confiáveis.",
      });
    }

    if (!transaction.date || !/^\d{4}-\d{2}-\d{2}$/.test(transaction.date)) {
      issues.push({
        id: `quality-date-${transaction.id}`,
        source: "transaction",
        entityId: transaction.id,
        field: "date",
        message: `${prefix}: data inválida.`,
        severity: "error",
        impact: "O lançamento pode entrar na competência errada.",
      });
    }

    if (
      !transaction.competence ||
      (transaction.competence !== competence &&
        transaction.projectedFromRecurring !== true)
    ) {
      issues.push({
        id: `quality-competence-${transaction.id}`,
        source: "transaction",
        entityId: transaction.id,
        field: "competence",
        message: `${prefix}: competência diferente do filtro analisado.`,
        severity: "warning",
        impact: "Pode distorcer cards do mês se a origem estiver errada.",
      });
    }

    if (transaction.amount <= 0) {
      issues.push({
        id: `quality-amount-${transaction.id}`,
        source: "transaction",
        entityId: transaction.id,
        field: "amount",
        message: `${prefix}: valor zerado ou negativo.`,
        severity: "error",
        impact: "Indicadores de fluxo e score ficam incorretos.",
      });
    }
  });

  invoices.forEach((invoice) => {
    if (!invoice.cardId) {
      issues.push({
        id: `quality-invoice-card-${invoice.id}`,
        source: "invoice",
        entityId: invoice.id,
        field: "cardId",
        message: "Fatura sem cartão vinculado.",
        severity: "error",
        impact: "O risco por cartão não consegue ser calculado.",
      });
    }

    if (!invoice.dueDate || !invoice.competence) {
      issues.push({
        id: `quality-invoice-competence-${invoice.id}`,
        source: "invoice",
        entityId: invoice.id,
        field: "competence",
        message: "Fatura sem vencimento ou competência.",
        severity: "error",
        impact: "A fatura pode cair no mês errado.",
      });
    }
  });

  installments.forEach((installment) => {
    if (
      installment.totalInstallments <= 0 ||
      installment.installmentNumber <= 0
    ) {
      issues.push({
        id: `quality-installment-total-${installment.id}`,
        source: "installment",
        entityId: installment.id,
        field: "totalInstallments",
        message: "Parcela sem número ou total de parcelas válido.",
        severity: "error",
        impact: "A projeção futura pode ficar incompleta.",
      });
    }

    if (installment.source === "card" && !installment.cardId) {
      issues.push({
        id: `quality-installment-card-${installment.id}`,
        source: "installment",
        entityId: installment.id,
        field: "cardId",
        message: "Parcela de cartão sem cartão vinculado.",
        severity: "warning",
        impact: "Pode haver duplicidade ou falta de vínculo com fatura.",
      });
    }
  });

  cards.forEach((card) => {
    if (!card.dueDay || card.dueDay < 1 || card.dueDay > 31) {
      issues.push({
        id: `quality-card-due-${card.id}`,
        source: "card",
        entityId: card.id,
        field: "dueDay",
        message: `${card.bank}: cartão sem vencimento válido.`,
        severity: "warning",
        impact: "Alertas de vencimento e risco de atraso ficam menos precisos.",
      });
    }
  });

  debts.forEach((debt) => {
    if (debt.balance > 0 && debt.monthlyPayment <= 0) {
      issues.push({
        id: `quality-debt-payment-${debt.id}`,
        source: "debt",
        entityId: debt.id,
        field: "monthlyPayment",
        message: `${debt.creditor}: dívida sem parcela mensal cadastrada.`,
        severity: "warning",
        impact: "Compromissos mensais podem estar subestimados.",
      });
    }
  });

  return issues;
}

function scoreQuality(issues: DataQualityIssue[]) {
  const errorPenalty =
    issues.filter((issue) => issue.severity === "error").length * 10;
  const warningPenalty =
    issues.filter((issue) => issue.severity === "warning").length * 4;
  return Math.round(clamp(100 - errorPenalty - warningPenalty, 0, 100));
}

function qualityLabel(score: number) {
  if (score >= 90) return "Base confiável";
  if (score >= 70) return "Base boa com ajustes";
  if (score >= 45) return "Diagnóstico parcial";
  return "Base frágil para decisão";
}

function buildScoreFactors({
  cardLoadPenalty,
  commitmentPenalty,
  debtPenalty,
  receivablePenalty,
  cashPenalty,
  reservePenalty,
  balancePenalty,
  dataQualityPenalty,
  committedIncomeRatio,
  cardIncomeRatio,
  debtRatio,
  pendingIncomeRatio,
  cashShortfall,
  reserveGap,
  projectedBalance,
  dataQualityScore,
}: {
  cardLoadPenalty: number;
  commitmentPenalty: number;
  debtPenalty: number;
  receivablePenalty: number;
  cashPenalty: number;
  reservePenalty: number;
  balancePenalty: number;
  dataQualityPenalty: number;
  committedIncomeRatio: number;
  cardIncomeRatio: number;
  debtRatio: number;
  pendingIncomeRatio: number;
  cashShortfall: number;
  reserveGap: number;
  projectedBalance: number;
  dataQualityScore: number;
}): ScoreFactor[] {
  const factors: ScoreFactor[] = [];

  const add = (
    id: string,
    label: string,
    points: number,
    currentValue: number,
    recommendedValue: number,
    explanation: string,
  ) => {
    if (points === 0) return;
    factors.push({
      id,
      label,
      points: -Math.round(points),
      currentValue,
      recommendedValue,
      explanation,
    });
  };

  add(
    "commitment",
    "Renda comprometida acima do limite seguro",
    commitmentPenalty,
    committedIncomeRatio,
    0.7,
    "O sistema compara todos os compromissos do mês com a renda prevista.",
  );
  add(
    "cards",
    "Faturas acima de 30% da renda",
    cardLoadPenalty,
    cardIncomeRatio,
    0.3,
    "Cartões pesados reduzem a margem para contas básicas e aumentam risco de atraso.",
  );
  add(
    "debt",
    "Endividamento elevado",
    debtPenalty,
    debtRatio,
    0.35,
    "Dívidas, empréstimos e faturas ocupam espaço que deveria sobrar para segurança.",
  );
  add(
    "receivables",
    "Receitas pendentes relevantes",
    receivablePenalty,
    pendingIncomeRatio,
    0.25,
    "Quando a renda ainda não entrou, a leitura precisa considerar risco de atraso.",
  );
  add(
    "cash",
    "Caixa descoberto",
    cashPenalty,
    cashShortfall,
    0,
    "Há contas abertas sem cobertura pelo dinheiro já recebido.",
  );
  add(
    "reserve",
    "Reserva abaixo do custo mensal",
    reservePenalty,
    reserveGap,
    0,
    "Sem reserva suficiente, qualquer imprevisto vira dívida ou atraso.",
  );
  add(
    "balance",
    "Saldo previsto negativo",
    balancePenalty,
    projectedBalance,
    0,
    "O mês tende a fechar no vermelho se nada mudar.",
  );
  add(
    "data",
    "Qualidade de dados incompleta",
    dataQualityPenalty,
    dataQualityScore,
    90,
    "Dados incompletos reduzem a confiança do diagnóstico.",
  );

  return factors;
}

function buildFinancialHighlight(
  label: string,
  value: string,
  amount: number,
): FinancialHighlight {
  return { label, value, amount };
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
  const monthlyTransactions = transactions.filter((item) =>
    transactionBelongsToCompetence(item, competence),
  );
  const incomeTransactions = monthlyTransactions.filter(
    (item) => item.type === "income",
  );
  const confirmedIncome = sum(
    incomeTransactions
      .filter((item) => item.status === "paid")
      .map((item) => item.amount),
  );
  const pendingIncome = sum(
    incomeTransactions
      .filter((item) => item.status !== "paid")
      .map((item) => item.amount),
  );
  const expectedIncome = confirmedIncome + pendingIncome;
  const income = expectedIncome;
  const directExpenses = monthlyTransactions.filter(
    (item) => item.type === "expense" && item.paymentRail !== "card",
  );
  const directFixedExpenses = sum(
    directExpenses.filter((item) => item.fixed).map((item) => item.amount),
  );
  const directVariableExpenses = sum(
    directExpenses.filter((item) => !item.fixed).map((item) => item.amount),
  );
  const paidDirectExpenses = sum(
    directExpenses
      .filter((item) => item.status === "paid")
      .map((item) => item.amount),
  );
  const pendingDirectExpenses = sum(
    directExpenses
      .filter((item) => item.status !== "paid")
      .map((item) => item.amount),
  );
  const currentInvoiceRows = invoices.filter((invoice) =>
    invoiceBelongsToCompetence(invoice, competence),
  );
  const cardsWithInvoiceRows = new Set(
    currentInvoiceRows.map((invoice) => invoice.cardId),
  );
  const fallbackCardInvoices = sum(
    cards
      .filter((card) => !cardsWithInvoiceRows.has(card.id))
      .map((card) => card.currentInvoice),
  );
  const paidCardInvoices = sum(
    currentInvoiceRows
      .filter((invoice) => invoice.status === "paid")
      .map((invoice) => invoice.totalAmount),
  );
  const openCardInvoices =
    fallbackCardInvoices +
    sum(
      currentInvoiceRows
        .filter((invoice) => invoice.status !== "paid")
        .map((invoice) => invoice.totalAmount),
    );
  const cardInvoices = paidCardInvoices + openCardInvoices;
  const currentLoanInstallmentsRows = installments.filter(
    (installment) =>
      installment.competence === competence && isLoanInstallment(installment),
  );

  const currentLoanInstallments = sum(
    currentLoanInstallmentsRows.map((installment) => installment.amount),
  );

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

  /*
    Regra financeira:
    - Faturas do mês = somente cartão.
    - Parcelas de cartão não entram de novo, pois já compõem a fatura.
    - Parcelas de empréstimo entram nos compromissos do mês.
    - Parcelas de empréstimo pagas reduzem o caixa realizado.
    - Parcelas de empréstimo abertas/agendadas entram nas obrigações abertas.
  */
  const debtPayments = debtMonthlyPayments + currentLoanInstallments;

  const totalOutflow =
    directFixedExpenses + directVariableExpenses + cardInvoices + debtPayments;

  const projectedBalance = income - totalOutflow;

  const realizedBalance =
    confirmedIncome -
    paidDirectExpenses -
    paidCardInvoices -
    paidLoanInstallments;

  const monthlyOpenObligations =
    pendingDirectExpenses +
    openCardInvoices +
    debtMonthlyPayments +
    pendingLoanInstallments;

  const immediateObligations = monthlyOpenObligations;
  const cashShortfall = Math.max(
    monthlyOpenObligations - Math.max(realizedBalance, 0),
    0,
  );
  const futureCommitments = buildFutureCommitments({
    monthlyTransactions,
    cards,
    debts,
    installments,
    baseCompetence: competence,
    currentCardInvoices: cardInvoices,
    referenceMonthlyIncome:
      profile.monthlyIncomeTarget > 0 ? profile.monthlyIncomeTarget : income,
  });
  const futureCommitmentRows = futureCommitments.slice(1);
  const nextMonthCommitment = futureCommitmentRows[0]?.total ?? 0;
  const futureCommitmentsTotal = sum(
    futureCommitmentRows.map((month) => month.total),
  );
  const futureInstallmentsTotal = sum(
    futureCommitmentRows.map(
      (month) => month.cardInstallments + month.loanInstallments,
    ),
  );
  const pendingIncomeRatio = income > 0 ? pendingIncome / income : 0;
  const pendingExpenseRatio =
    totalOutflow > 0 ? monthlyOpenObligations / totalOutflow : 0;
  const committedIncomeRatio = income > 0 ? totalOutflow / income : 0;
  const cardIncomeRatio = income > 0 ? cardInvoices / income : 0;
  const debtRatio = income > 0 ? (debtPayments + cardInvoices) / income : 0;
  const essentialDirectExpenses = sum(
    directExpenses
      .filter((item) => item.essentiality === "essential")
      .map((item) => item.amount),
  );
  const adjustableTransactions = monthlyTransactions.filter(
    (item) =>
      item.type === "expense" &&
      (item.essentiality === "adjustable" ||
        item.essentiality === "superfluous" ||
        item.essentiality === "impulsive"),
  );
  const essentialMonthlyCost = essentialDirectExpenses + debtMonthlyPayments;
  const essentialExpenseRatio = income > 0 ? essentialMonthlyCost / income : 0;
  const variableExpenseRatio = income > 0 ? directVariableExpenses / income : 0;
  const reserveDebtInvestmentRatio =
    income > 0
      ? (debtPayments +
          directExpenses
            .filter((item) => item.category.toLowerCase().includes("invest"))
            .reduce((total, item) => total + item.amount, 0)) /
        income
      : 0;
  const cardWeightRatio = income > 0 ? openCardInvoices / income : 0;
  const referenceIncome = income > 0 ? income : profile.monthlyIncomeTarget;
  const monthsCommittedCount =
    referenceIncome > 0
      ? futureCommitmentRows.filter(
          (month) => month.total / referenceIncome > 0.45,
        ).length
      : futureCommitmentRows.filter((month) => month.total > 0).length;
  const dataQualityIssues = buildDataQualityIssues({
    profile,
    transactions: monthlyTransactions,
    invoices: currentInvoiceRows,
    installments,
    cards,
    debts,
    competence,
  });
  const dataQualityScore = scoreQuality(dataQualityIssues);
  const dataQualityPenalty = clamp((90 - dataQualityScore) / 90, 0, 1) * 10;
  // Thresholds alinhados com as metas exibidas ao usuário e padrões bancários reais.
  // Penalidades de reserva e saldo são proporcionais à gravidade (não mais fixas).
  const cardLoadPenalty = clamp(cardIncomeRatio - 0.3, 0, 1) * 22;           // meta 30% exibida
  const commitmentPenalty = clamp(committedIncomeRatio - 0.7, 0, 1) * 35;    // meta 70% exibida
  const debtPenalty = clamp(debtRatio - 0.35, 0, 1) * 20;                    // meta 35% exibida
  const receivablePenalty = clamp(pendingIncomeRatio - 0.25, 0, 1) * 10;     // meta 25% exibida
  const cashPenalty =
    cashShortfall > 0
      ? clamp(cashShortfall / Math.max(income, 1), 0, 1) * 14
      : 0;
  const reserveGap = Math.max(totalOutflow - profile.currentReserve, 0);
  // Proporcional: penalidade máxima (14) somente quando reserva está zerada
  const reservePenalty =
    reserveGap > 0
      ? clamp(reserveGap / Math.max(totalOutflow, 1), 0, 1) * 14
      : 0;
  // Proporcional: déficit de R$1 não vale o mesmo que déficit de R$5.000
  const balancePenalty =
    projectedBalance < 0
      ? clamp(Math.abs(projectedBalance) / Math.max(income, 1), 0, 1) * 15
      : 0;
  const healthScore = Math.round(
    clamp(
      100 -
        cardLoadPenalty -
        commitmentPenalty -
        debtPenalty -
        receivablePenalty -
        cashPenalty -
        reservePenalty -
        balancePenalty -
        dataQualityPenalty,
      0,
      100,
    ),
  );
  const riskLevel = riskFromScore(healthScore);
  const potentialSavings = sum(
    monthlyTransactions
      .filter((item) => item.type === "expense")
      .filter(
        (item) =>
          item.essentiality === "superfluous" ||
          item.essentiality === "impulsive",
      )
      .map((item) => item.amount * 0.65),
  );
  const scoreFactors = buildScoreFactors({
    cardLoadPenalty,
    commitmentPenalty,
    debtPenalty,
    receivablePenalty,
    cashPenalty,
    reservePenalty,
    balancePenalty,
    dataQualityPenalty,
    committedIncomeRatio,
    cardIncomeRatio,
    debtRatio,
    pendingIncomeRatio,
    cashShortfall,
    reserveGap,
    projectedBalance,
    dataQualityScore,
  });
  const topCategoryRow = categoryTotals(monthlyTransactions)[0];
  const riskiestCard = [...cards].sort((a, b) => {
    const bRatio = b.limit > 0 ? b.currentInvoice / b.limit : 0;
    const aRatio = a.limit > 0 ? a.currentInvoice / a.limit : 0;
    return bRatio - aRatio || b.currentInvoice - a.currentInvoice;
  })[0];
  const biggestLeakRow = adjustableTransactions.reduce<Transaction | null>(
    (current, transaction) => {
      if (!current) return transaction;
      return transaction.amount > current.amount ? transaction : current;
    },
    null,
  );
  const mostHarmfulRow = monthlyTransactions
    .filter((item) => item.type === "expense")
    .reduce<Transaction | null>((current, transaction) => {
      if (!current) return transaction;
      return transaction.amount > current.amount ? transaction : current;
    }, null);
  const safeDailySpend = Math.max(projectedBalance, 0) / 30;
  const safeWeeklySpend = safeDailySpend * 7;
  const monthlyCashAvailable = Math.max(
    confirmedIncome -
      paidDirectExpenses -
      paidCardInvoices -
      paidLoanInstallments,
    0,
  );
  const moneyLastsDays =
    totalOutflow > 0
      ? Math.floor(monthlyCashAvailable / Math.max(totalOutflow / 30, 1))
      : 30;
  const urgentAmount = Math.max(
    cashShortfall,
    Math.abs(Math.min(projectedBalance, 0)),
    0,
  );
  const reserveSelectedMonths = profile.reserveMonthsDesired ?? 6;
  const reserveTargets = {
    essentialMonthlyCost,
    minimum: essentialMonthlyCost * 3,
    comfortable: essentialMonthlyCost * 6,
    robust: essentialMonthlyCost * 12,
    selectedMonths: reserveSelectedMonths,
    selectedTarget: essentialMonthlyCost * reserveSelectedMonths,
    explanation:
      essentialMonthlyCost > 0
        ? "Meta calculada pelo custo essencial mensal multiplicado pelos meses de reserva desejados."
        : "Cadastre despesas essenciais por pelo menos um mês para calcular a reserva ideal.",
    hasEnoughData: essentialMonthlyCost > 0,
  };
  const automaticIdealIncome = (() => {
    if (totalOutflow <= 0 && essentialMonthlyCost <= 0) {
      return {
        amount: 0,
        explanation:
          "Renda ideal será calculada após cadastrar receitas, despesas, cartões e faturas.",
        hasEnoughData: false,
      };
    }

    if (riskLevel === "excellent" || riskLevel === "healthy") {
      return {
        amount: essentialMonthlyCost / 0.5,
        explanation:
          "Sua renda ideal foi calculada usando gastos essenciais dentro de 50% da renda.",
        hasEnoughData: essentialMonthlyCost > 0,
      };
    }

    if (riskLevel === "attention" || riskLevel === "risk") {
      return {
        amount: totalOutflow / 0.7,
        explanation:
          "Sua renda ideal considera compromissos obrigatórios limitados a 70% da renda.",
        hasEnoughData: totalOutflow > 0,
      };
    }

    return {
      amount: totalOutflow + Math.max(urgentAmount, income * 0.1),
      explanation:
        "Sua renda ideal considera compromissos, faturas críticas, dívidas e uma margem mínima de recuperação.",
      hasEnoughData: totalOutflow > 0,
    };
  })();

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
    debtMonthlyPayments,
    loanInstallments: currentLoanInstallments,
    paidLoanInstallments,
    pendingLoanInstallments,
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
    essentialExpenseRatio,
    variableExpenseRatio,
    reserveDebtInvestmentRatio,
    cardWeightRatio,
    monthsCommittedCount,
    savingsCapacity: income > 0 ? projectedBalance / income : 0,
    potentialSavings,
    dailyAverageSpend: totalOutflow / 30,
    weeklyAverageSpend: totalOutflow / 4.345,
    safeDailySpend,
    safeWeeklySpend,
    moneyLastsDays,
    urgentAmount,
    freeUntilMonthEnd: projectedBalance,
    healthScore,
    scoreFactors,
    riskLevel,
    financialStatus: statusFromRisk(riskLevel),
    adaptiveBudget: adaptiveBudgetFor(healthScore),
    futureCommitments,
    topCardRisk: riskiestCard
      ? buildFinancialHighlight(
          `${riskiestCard.bank} - ${riskiestCard.name}`,
          riskiestCard.limit > 0
            ? `${Math.round((riskiestCard.currentInvoice / riskiestCard.limit) * 100)}% do limite`
            : "Sem limite cadastrado",
          riskiestCard.currentInvoice,
        )
      : undefined,
    topCategory: topCategoryRow
      ? buildFinancialHighlight(
          topCategoryRow.category,
          "Categoria mais pesada do mês",
          topCategoryRow.amount,
        )
      : undefined,
    biggestLeak: biggestLeakRow
      ? buildFinancialHighlight(
          biggestLeakRow.description,
          biggestLeakRow.category,
          biggestLeakRow.amount,
        )
      : undefined,
    mostHarmfulExpense: mostHarmfulRow
      ? buildFinancialHighlight(
          mostHarmfulRow.description,
          mostHarmfulRow.category,
          mostHarmfulRow.amount,
        )
      : undefined,
    reserveTargets,
    automaticIdealIncome,
    dataQualityIssues,
    dataQualityScore,
    dataReliabilityLabel: qualityLabel(dataQualityScore),
  };
}

export function buildDiagnostics(
  summary: FinancialSummary,
  cards: Card[],
  debts: Debt[],
): DiagnosticFinding[] {
  const findings: DiagnosticFinding[] = [];
  const pushFinding = (finding: DiagnosticFinding) => findings.push(finding);

  if (summary.committedIncomeRatio > 0.7) {
    const recommendedValue = 0.7;
    pushFinding({
      id: "diag-income",
      title: "Renda comprometida acima do limite seguro",
      description:
        "A competência selecionada está operando em zona de pressão. A prioridade é reduzir faturas do mês, contas abertas e novas parcelas antes de buscar investimentos.",
      severity: summary.committedIncomeRatio > 0.9 ? "critical" : "risk",
      metric: "Comprometimento",
      category: "comprometimento",
      currentValue: summary.committedIncomeRatio,
      recommendedValue,
      deviation: summary.committedIncomeRatio - recommendedValue,
      meaning:
        "Seus compromissos estão ocupando uma fatia alta da renda do mês.",
      risk: "A margem para imprevistos fica pequena e qualquer atraso de receita pode virar atraso, crédito caro ou renegociação em cima da hora.",
      recommendedAction:
        "Reduzir faturas, pausar novas parcelas e cortar gastos ajustáveis antes de assumir qualquer novo compromisso.",
      deadline: "sevenDays",
      estimatedImpact: summary.urgentAmount,
    });
  }

  if (summary.cardIncomeRatio > 0.3) {
    const recommendedValue = 0.3;
    pushFinding({
      id: "diag-card",
      title: "Faturas do mês pesando mais que 30% da renda",
      description:
        "As faturas da competência consomem uma parcela relevante do caixa. O cartão mais sensível deve receber teto semanal e revisão de compras recorrentes.",
      severity: summary.cardIncomeRatio > 0.55 ? "critical" : "risk",
      metric: "Cartões",
      category: "cartões",
      currentValue: summary.cardIncomeRatio,
      recommendedValue,
      deviation: summary.cardIncomeRatio - recommendedValue,
      meaning:
        "O cartão está consumindo mais renda do que o limite prudente para uma vida financeira estável.",
      risk: "Fatura alta aumenta chance de rotativo, parcelamento de fatura ou uso de outro crédito para fechar o mês.",
      recommendedAction:
        "Congelar novas compras parceladas, revisar recorrências e priorizar o cartão de maior risco.",
      deadline: "sevenDays",
      estimatedImpact: Math.max(
        summary.cardInvoices - summary.income * recommendedValue,
        0,
      ),
    });
  }

  if (summary.projectedBalance < 0) {
    pushFinding({
      id: "diag-balance",
      title: "Saldo mensal projetado negativo",
      description:
        "Mesmo sem novos gastos na competência selecionada, o mês tende a fechar no vermelho. A decisão correta é atacar vazamentos de caixa em até 7 dias.",
      severity: "critical",
      metric: "Fluxo",
      category: "fluxo",
      currentValue: summary.projectedBalance,
      recommendedValue: 0,
      deviation: Math.abs(summary.projectedBalance),
      meaning: "A renda prevista não cobre todos os compromissos do mês.",
      risk: "Se nada mudar, será necessário usar crédito, reserva, atrasar contas ou renegociar vencimentos.",
      recommendedAction:
        "Resolver o valor negativo antes dos vencimentos: cortar, adiar, renegociar ou antecipar entrada.",
      deadline: "today",
      estimatedImpact: Math.abs(summary.projectedBalance),
    });
  }

  if (summary.pendingIncome > 0 && summary.pendingIncomeRatio > 0.25) {
    const recommendedValue = 0.25;
    pushFinding({
      id: "diag-receivables",
      title: "Receitas pendentes sustentam parte relevante do mês",
      description:
        "Uma fatia importante da renda ainda não entrou no caixa. A recomendação gerencial é separar o orçamento em cenário confirmado e cenário previsto antes de liberar gastos variáveis.",
      severity: summary.pendingIncomeRatio > 0.45 ? "risk" : "attention",
      metric: "Recebíveis",
      category: "receitas",
      currentValue: summary.pendingIncomeRatio,
      recommendedValue,
      deviation: summary.pendingIncomeRatio - recommendedValue,
      meaning: "O mês depende de dinheiro que ainda não foi recebido.",
      risk: "Se esse valor atrasar, o caixa pode ficar negativo mesmo que o orçamento pareça equilibrado.",
      recommendedAction:
        "Confirmar datas de recebimento e liberar gastos variáveis apenas depois da entrada real.",
      deadline: "sevenDays",
      estimatedImpact: summary.pendingIncome,
    });
  }

  if (summary.monthlyOpenObligations > 0 && summary.cashShortfall > 0) {
    pushFinding({
      id: "diag-payables",
      title: "Obrigações pendentes acima do caixa confirmado",
      description: `Há ${summary.cashShortfall.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 })} em aberto no mês sem cobertura por receita já recebida. Priorize vencimentos, juros e serviços essenciais antes de novos compromissos.`,
      severity:
        summary.cashShortfall > summary.income * 0.25 ? "critical" : "risk",
      metric: "Contas a pagar",
      category: "caixa",
      currentValue: summary.cashShortfall,
      recommendedValue: 0,
      deviation: summary.cashShortfall,
      meaning:
        "Há contas abertas que ainda não têm caixa confirmado para pagamento.",
      risk: "O risco é chegar perto do vencimento sem dinheiro suficiente e acabar pagando juros ou escolhendo contas para atrasar.",
      recommendedAction:
        "Montar ordem de pagamento por prioridade: essencial, juros altos, vencimento próximo e depois ajustáveis.",
      deadline: "today",
      estimatedImpact: summary.cashShortfall,
    });
  }

  if (summary.realizedBalance < 0) {
    pushFinding({
      id: "diag-realized-cash",
      title: "Caixa realizado negativo",
      description:
        "O dinheiro efetivamente recebido não cobre o que já foi pago. Isso indica dependência de entradas futuras ou uso de crédito para fechar o mês.",
      severity: "critical",
      metric: "Caixa realizado",
      category: "caixa realizado",
      currentValue: summary.realizedBalance,
      recommendedValue: 0,
      deviation: Math.abs(summary.realizedBalance),
      meaning: "O caixa que já entrou não pagou tudo que já saiu.",
      risk: "Isso cria dependência de recebimentos futuros e pode esconder um problema real de fluxo.",
      recommendedAction:
        "Separar o que já foi pago, o que ainda falta pagar e o que realmente vai entrar no mês.",
      deadline: "sevenDays",
      estimatedImpact: Math.abs(summary.realizedBalance),
    });
  }

  const highestInterestDebt = debts.find((debt) => debt.interestRateMonth >= 8);
  if (highestInterestDebt) {
    pushFinding({
      id: "diag-debt",
      title: "Dívida de juros alto exige ataque prioritário",
      description: `${highestInterestDebt.creditor} tem custo mensal superior ao aceitável. Renegociar ou quitar reduz o risco de bola de neve.`,
      severity: "risk",
      metric: "Dívidas",
      category: "dívidas",
      currentValue: highestInterestDebt.interestRateMonth,
      recommendedValue: 3,
      deviation: highestInterestDebt.interestRateMonth - 3,
      meaning:
        "A taxa mensal está alta e pode crescer mais rápido que sua capacidade de pagamento.",
      risk: "Juros altos transformam parcelas pequenas em bola de neve quando o fluxo aperta.",
      recommendedAction:
        "Simular quitação, renegociação ou troca por custo menor antes de atacar dívidas baratas.",
      deadline: "thirtyDays",
      estimatedImpact: highestInterestDebt.monthlyPayment,
    });
  }

  const riskiestCard = [...cards].sort((a, b) => {
    const bRatio = b.limit > 0 ? b.currentInvoice / b.limit : 0;
    const aRatio = a.limit > 0 ? a.currentInvoice / a.limit : 0;
    return bRatio - aRatio || b.currentInvoice - a.currentInvoice;
  })[0];
  const cardRatio =
    riskiestCard && riskiestCard.limit > 0
      ? riskiestCard.currentInvoice / riskiestCard.limit
      : 0;
  if (riskiestCard && cardRatio > 0.3) {
    pushFinding({
      id: "diag-card-limit",
      title: `${riskiestCard.bank} concentra risco de fatura`,
      description:
        "A combinação de fatura alta, limite usado e parcelas futuras aumenta o risco de atraso nos próximos vencimentos.",
      severity: cardRatio > 0.65 ? "risk" : "attention",
      metric: "Fatura",
      category: "cartão",
      currentValue: cardRatio,
      recommendedValue: 0.3,
      deviation: cardRatio - 0.3,
      meaning: "Este cartão é o ponto mais sensível do mês.",
      risk: "Se a fatura crescer, ela pode puxar o saldo previsto para baixo mesmo com despesas diretas controladas.",
      recommendedAction:
        "Definir teto de uso, revisar compras recorrentes e evitar parcelamentos novos nesse cartão.",
      deadline: "sevenDays",
      estimatedImpact: Math.max(
        riskiestCard.currentInvoice - riskiestCard.limit * 0.3,
        0,
      ),
    });
  }

  if (summary.dataQualityScore < 70) {
    pushFinding({
      id: "diag-data-quality",
      title: "Dados incompletos podem afetar o diagnóstico",
      description:
        "Existem lançamentos, faturas, parcelas ou cartões com dados incompletos. O diagnóstico funciona, mas fica parcial até a base ser corrigida.",
      severity: summary.dataQualityScore < 45 ? "risk" : "attention",
      metric: "Qualidade de dados",
      category: "dados",
      currentValue: summary.dataQualityScore,
      recommendedValue: 90,
      deviation: 90 - summary.dataQualityScore,
      meaning:
        "O sistema encontrou inconsistências que reduzem a confiabilidade da leitura.",
      risk: "Dados incompletos podem gerar saldo, fatura ou categoria mais pesada fora da realidade.",
      recommendedAction:
        "Corrigir itens sem categoria, valor, data, cartão ou competência antes de tomar decisões maiores.",
      deadline: "thirtyDays",
      estimatedImpact: 0,
    });
  }

  return findings;
}

export function buildAlerts(
  summary: FinancialSummary,
  cards: Card[],
): AlertItem[] {
  const alerts: AlertItem[] = [];

  if (summary.freeUntilMonthEnd < 0) {
    alerts.push({
      id: "alert-cash",
      title: "Saldo livre insuficiente",
      message:
        "Após considerar renda, faturas e compromissos, o mês tende a fechar negativo.",
      level: "critical",
      source: "cashflow",
      category: "Fluxo de caixa",
      simpleExplanation:
        "Falta dinheiro para o mês fechar sem crédito, reserva ou atraso.",
      ignoredRisk:
        "Você pode precisar usar crédito, atrasar conta ou parcelar fatura.",
      recommendedAction:
        "Reorganizar pagamentos e reduzir gastos ajustáveis imediatamente.",
      suggestedDeadline: "today",
      estimatedImpact: Math.abs(summary.freeUntilMonthEnd),
      diagnosticId: "diag-balance",
    });
  }

  if (summary.cashShortfall > 0) {
    alerts.push({
      id: "alert-confirmed-cash",
      title: "Caixa confirmado insuficiente",
      message:
        "As obrigações em aberto da competência superam o dinheiro já recebido no mês.",
      level:
        summary.cashShortfall > summary.income * 0.25 ? "critical" : "risk",
      source: "cashflow",
      category: "Caixa realizado",
      simpleExplanation:
        "Há contas abertas que ainda não têm dinheiro confirmado para pagamento.",
      ignoredRisk:
        "O risco é chegar no vencimento sem cobertura e pagar juros.",
      recommendedAction:
        "Confirmar entradas pendentes e ordenar pagamentos por urgência.",
      suggestedDeadline: "today",
      estimatedImpact: summary.cashShortfall,
      diagnosticId: "diag-payables",
    });
  }

  if (summary.pendingIncomeRatio > 0.35) {
    alerts.push({
      id: "alert-pending-income",
      title: "Receita pendente relevante",
      message:
        "Parte importante do orçamento ainda depende de recebimentos não confirmados.",
      level: "attention",
      source: "cashflow",
      category: "Receitas",
      simpleExplanation:
        "Seu orçamento depende de dinheiro que ainda não entrou.",
      ignoredRisk:
        "Se a entrada atrasar, o mês pode fechar pior que o previsto.",
      recommendedAction:
        "Validar datas de recebimento antes de liberar gasto variável.",
      suggestedDeadline: "sevenDays",
      estimatedImpact: summary.pendingIncome,
      diagnosticId: "diag-receivables",
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
        category: "Cartão",
        simpleExplanation:
          "Este cartão está consumindo uma parte sensível do limite e pode pressionar o mês.",
        ignoredRisk:
          "A fatura pode virar atraso, rotativo ou parcelamento caro.",
        recommendedAction:
          "Bloquear novas parcelas e revisar compras recorrentes nesse cartão.",
        suggestedDeadline: "sevenDays",
        estimatedImpact: Math.max(card.currentInvoice - card.limit * 0.3, 0),
        diagnosticId: "diag-card-limit",
      });
    }
  });

  if (
    summary.income > 0 &&
    summary.futureCommitments
      .slice(1, 4)
      .some((month) => month.total / summary.income > 0.45)
  ) {
    alerts.push({
      id: "alert-installments",
      title: "Próximos 3 meses já estão comprometidos",
      message:
        "Parcelas futuras mantêm pressão mesmo com congelamento imediato de novas compras.",
      level: "risk",
      source: "installments",
      category: "Parcelas futuras",
      simpleExplanation:
        "Mesmo parando de gastar hoje, os próximos meses já têm compromissos importantes.",
      ignoredRisk:
        "O problema pode continuar se novas parcelas forem abertas agora.",
      recommendedAction:
        "Congelar parcelamentos e priorizar quitação ou renegociação do que vence primeiro.",
      suggestedDeadline: "thirtyDays",
      estimatedImpact: summary.futureInstallmentsTotal,
      diagnosticId: "diag-income",
    });
  }

  if (summary.dataQualityIssues.length > 0) {
    alerts.push({
      id: "alert-data-quality",
      title: "Dados incompletos afetam a leitura",
      message:
        "Existem dados incompletos que podem afetar o diagnóstico financeiro.",
      level: summary.dataQualityScore < 45 ? "risk" : "attention",
      source: "data",
      category: "Qualidade de dados",
      simpleExplanation:
        "O sistema consegue analisar, mas a confiança melhora quando categorias, datas, cartões e valores estão completos.",
      ignoredRisk:
        "Você pode tomar decisão com saldo, categoria ou fatura fora da realidade.",
      recommendedAction:
        "Corrigir os lançamentos sinalizados antes de fechar o plano do mês.",
      suggestedDeadline: "thirtyDays",
      estimatedImpact: 0,
      diagnosticId: "diag-data-quality",
    });
  }

  return alerts;
}

export function buildScenario(
  summary: FinancialSummary,
  monthlyCut: number,
  incomeIncrease: number,
) {
  const adjustedIncome = summary.income + incomeIncrease;
  const adjustedOutflow = Math.max(summary.totalOutflow - monthlyCut, 0);
  const adjustedBalance = adjustedIncome - adjustedOutflow;
  const adjustedCommitment =
    adjustedIncome > 0 ? adjustedOutflow / adjustedIncome : 0;
  const scoreGain = Math.round(monthlyCut / 120 + incomeIncrease / 200);

  return {
    adjustedIncome,
    adjustedOutflow,
    adjustedBalance,
    adjustedCommitment,
    adjustedScore: clamp(summary.healthScore + scoreGain, 0, 100),
    recoveryMonths:
      adjustedBalance > 0 ? Math.ceil(1800 / adjustedBalance) : 99,
  };
}

export function buildRuleBasedActions(summary: FinancialSummary): ActionItem[] {
  const actions: ActionItem[] = [];

  if (summary.urgentAmount > 0) {
    actions.push({
      id: "rule-urgent-cash",
      title: "Resolver o valor urgente do mês",
      reason:
        "O saldo previsto ou o caixa confirmado mostra valor sem cobertura. Esse é o primeiro número a atacar antes de pensar em investimento.",
      priority: "urgent",
      horizon: "Hoje",
      expectedSavings: Math.round(summary.urgentAmount),
      difficulty: "alta",
      status: "planned",
      firstStep:
        "Separar vencimentos dos próximos 7 dias e escolher o que será pago, renegociado ou cortado.",
      scoreImpact: 12,
      diagnosticId: "diag-balance",
    });
  }

  if (summary.pendingIncome > 0) {
    actions.push({
      id: "rule-confirm-income",
      title: "Confirmar recebimentos pendentes",
      reason:
        "O plano do mês depende de receitas ainda não recebidas. Confirme datas, responsáveis e risco de atraso antes de liberar despesas variáveis.",
      priority: summary.pendingIncomeRatio > 0.35 ? "urgent" : "high",
      horizon: "7 dias",
      expectedSavings: Math.round(summary.pendingIncome),
      difficulty: "baixa",
      status: "planned",
      firstStep:
        "Entrar em contato com a origem da receita e confirmar data real de entrada.",
      scoreImpact: 6,
      diagnosticId: "diag-receivables",
    });
  }

  if (summary.cashShortfall > 0) {
    actions.push({
      id: "rule-cash-coverage",
      title: "Montar ordem de pagamento por prioridade",
      reason:
        "As obrigações abertas do mês superam o caixa confirmado. Pague primeiro essenciais e juros altos, renegocie o restante e evite novas compras.",
      priority: "urgent",
      horizon: "7 dias",
      expectedSavings: Math.round(summary.cashShortfall),
      difficulty: "media",
      status: "planned",
      firstStep: "Listar contas por vencimento, juros e essencialidade.",
      scoreImpact: 10,
      diagnosticId: "diag-payables",
    });
  }

  if (summary.cardIncomeRatio > 0.3) {
    actions.push({
      id: "rule-card-freeze",
      title: "Congelar novas compras parceladas",
      reason:
        "Cartões acima de 30% da renda elevam o risco de atraso e rolagem.",
      priority: "urgent",
      horizon: "7 dias",
      expectedSavings: Math.round(summary.cardInvoices * 0.18),
      difficulty: "media",
      status: "planned",
      firstStep:
        "Bloquear novas parcelas e revisar compras recorrentes do cartão mais crítico.",
      scoreImpact: 8,
      diagnosticId: "diag-card",
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
      firstStep:
        "Ordenar despesas ajustáveis por valor e recorrência; cortar primeiro as de baixo impacto na rotina.",
      scoreImpact: 7,
      diagnosticId: "diag-income",
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
      firstStep:
        "Montar uma tabela simples: renda que entra, contas que vencem e valor faltante.",
      scoreImpact: 12,
      diagnosticId: "diag-balance",
    });
  }

  if (actions.length === 0) {
    actions.push({
      id: "rule-reserve",
      title: "Automatizar reserva mensal",
      reason:
        "Com fluxo sob controle, a próxima decisão é aumentar resiliência.",
      priority: "medium",
      horizon: "90 dias",
      expectedSavings: Math.max(Math.round(summary.income * 0.05), 0),
      difficulty: "baixa",
      status: "planned",
      firstStep: "Definir transferência automática no começo do mês.",
      scoreImpact: 5,
    });
  }

  return actions;
}

export function categoryTotals(
  transactions: Transaction[],
  competence?: string,
) {
  const scopedTransactions = competence
    ? transactions.filter((item) =>
        transactionBelongsToCompetence(item, competence),
      )
    : transactions;
  const expenseTransactions = scopedTransactions.filter(
    (item) => item.type === "expense",
  );
  const totals = expenseTransactions.reduce<Record<string, number>>(
    (acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + item.amount;
      return acc;
    },
    {},
  );

  return Object.entries(totals)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}
