import type {
  ActionItem,
  Card,
  Debt,
  FinancialProfile,
  Goal,
  Installment,
  Investment,
  Invoice,
  Transaction,
} from "../types/finance";

export function mapProfile(row: any): FinancialProfile {
  return {
    id: row.id,
    ownerName: row.owner_name,
    householdName: row.household_name,
    monthlyIncomeTarget: Number(row.monthly_income_target ?? 0),
    currentReserve: Number(row.current_reserve ?? 0),
    reserveTarget: Number(row.reserve_target ?? 0),
    idealIncome: Number(row.ideal_income ?? 0),
    riskTolerance: row.risk_tolerance ?? "medium",
    preferredRule: row.preferred_rule ?? "70-10-20",
  };
}

export function profileToRow(profile: Omit<FinancialProfile, "id">) {
  return {
    owner_name: profile.ownerName,
    household_name: profile.householdName,
    monthly_income_target: profile.monthlyIncomeTarget,
    current_reserve: profile.currentReserve,
    reserve_target: profile.reserveTarget,
    ideal_income: profile.idealIncome,
    risk_tolerance: profile.riskTolerance,
    preferred_rule: profile.preferredRule,
  };
}

export function mapTransaction(row: any): Transaction {
  return {
    id: row.id,
    date: row.transaction_date,
    competence: row.competence,
    description: row.description,
    amount: Number(row.amount ?? 0),
    type: row.type,
    category: row.category,
    subcategory: row.subcategory ?? "",
    essentiality: row.essentiality ?? "important",
    recurring: Boolean(row.recurring),
    fixed: Boolean(row.fixed),
    paymentRail: row.payment_rail ?? "bank",
    bank: row.bank ?? "",
    cardId: row.card_id ?? undefined,
    installment: row.installment ?? undefined,
    totalInstallments: row.total_installments ?? undefined,
    status: row.status ?? "open",
    priority: row.priority ?? "adjustable",
    impact: row.impact ?? "medium",
    notes: row.observations ?? undefined,
  };
}

export function transactionToRow(transaction: Omit<Transaction, "id"> | Partial<Transaction>) {
  return {
    transaction_date: transaction.date,
    competence: transaction.competence,
    description: transaction.description,
    amount: transaction.amount,
    type: transaction.type,
    category: transaction.category,
    subcategory: transaction.subcategory,
    essentiality: transaction.essentiality,
    recurring: transaction.recurring,
    fixed: transaction.fixed,
    payment_rail: transaction.paymentRail,
    bank: transaction.bank,
    card_id: transaction.cardId ?? null,
    installment: transaction.installment ?? null,
    total_installments: transaction.totalInstallments ?? null,
    status: transaction.status,
    priority: transaction.priority,
    impact: transaction.impact,
    observations: transaction.notes,
  };
}

export function mapCard(row: any, currentInvoice = 0, previousInvoice = 0, futureInstallments: number[] = []): Card {
  return {
    id: row.id,
    name: row.name,
    bank: row.bank,
    limit: Number(row.limit_amount ?? 0),
    currentInvoice,
    previousInvoice,
    dueDay: Number(row.due_day ?? 1),
    closingDay: Number(row.closing_day ?? 1),
    futureInstallments,
    interestRateMonth: Number(row.interest_rate_month ?? 0),
  };
}

export function cardToRow(card: Omit<Card, "id" | "currentInvoice" | "previousInvoice" | "futureInstallments"> | Partial<Card>) {
  return {
    name: card.name,
    bank: card.bank,
    limit_amount: card.limit,
    due_day: card.dueDay,
    closing_day: card.closingDay,
    interest_rate_month: card.interestRateMonth,
  };
}

export function mapInvoice(row: any): Invoice {
  return {
    id: row.id,
    cardId: row.card_id,
    competence: row.competence,
    dueDate: row.due_date,
    closingDate: row.closing_date ?? undefined,
    totalAmount: Number(row.total_amount ?? 0),
    paidAmount: Number(row.paid_amount ?? 0),
    status: row.status ?? "open",
  };
}

export function invoiceToRow(invoice: Omit<Invoice, "id"> | Partial<Invoice>) {
  return {
    card_id: invoice.cardId,
    competence: invoice.competence,
    due_date: invoice.dueDate,
    closing_date: invoice.closingDate ?? null,
    total_amount: invoice.totalAmount,
    paid_amount: invoice.paidAmount,
    status: invoice.status,
  };
}

export function mapInstallment(row: any): Installment {
  return {
    id: row.id,
    transactionId: row.transaction_id ?? undefined,
    cardId: row.card_id ?? undefined,
    competence: row.competence,
    installmentNumber: Number(row.installment_number ?? 1),
    totalInstallments: Number(row.total_installments ?? 1),
    amount: Number(row.amount ?? 0),
    status: row.status ?? "scheduled",
  };
}

export function installmentToRow(installment: Omit<Installment, "id"> | Partial<Installment>) {
  return {
    transaction_id: installment.transactionId ?? null,
    card_id: installment.cardId ?? null,
    competence: installment.competence,
    installment_number: installment.installmentNumber,
    total_installments: installment.totalInstallments,
    amount: installment.amount,
    status: installment.status,
  };
}

export function mapDebt(row: any): Debt {
  return {
    id: row.id,
    creditor: row.creditor,
    type: row.debt_type,
    balance: Number(row.balance ?? 0),
    monthlyPayment: Number(row.monthly_payment ?? 0),
    interestRateMonth: Number(row.interest_rate_month ?? 0),
    monthsLeft: Number(row.months_left ?? 0),
    renegotiable: Boolean(row.renegotiable),
  };
}

export function mapInvestment(row: any): Investment {
  return {
    id: row.id,
    name: row.name,
    type: row.investment_type,
    amount: Number(row.amount ?? 0),
    liquidityDays: Number(row.liquidity_days ?? 0),
  };
}

export function mapGoal(row: any): Goal {
  return {
    id: row.id,
    name: row.name,
    target: Number(row.target ?? 0),
    current: Number(row.current ?? 0),
    deadline: row.deadline,
    priority: row.priority ?? "medium",
  };
}

export function mapAction(row: any): ActionItem {
  return {
    id: row.id,
    title: row.title,
    reason: row.reason,
    priority: row.priority,
    horizon: row.horizon,
    expectedSavings: Number(row.expected_savings ?? 0),
    difficulty: row.difficulty ?? "media",
    status: row.status ?? "planned",
  };
}

export function actionToRow(action: Omit<ActionItem, "id"> | Partial<ActionItem>) {
  return {
    title: action.title,
    reason: action.reason,
    priority: action.priority,
    horizon: action.horizon,
    expected_savings: action.expectedSavings,
    difficulty: action.difficulty,
    status: action.status,
  };
}
