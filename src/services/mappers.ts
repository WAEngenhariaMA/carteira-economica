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

function withoutUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));
}

export function profileToRow(profile: Partial<Omit<FinancialProfile, "id">>) {
  return withoutUndefined({
    owner_name: profile.ownerName,
    household_name: profile.householdName,
    monthly_income_target: profile.monthlyIncomeTarget,
    current_reserve: profile.currentReserve,
    reserve_target: profile.reserveTarget,
    ideal_income: profile.idealIncome,
    risk_tolerance: profile.riskTolerance,
    preferred_rule: profile.preferredRule,
  });
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
  return withoutUndefined({
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
    card_id: "cardId" in transaction ? transaction.cardId ?? null : undefined,
    installment: "installment" in transaction ? transaction.installment ?? null : undefined,
    total_installments: "totalInstallments" in transaction ? transaction.totalInstallments ?? null : undefined,
    status: transaction.status,
    priority: transaction.priority,
    impact: transaction.impact,
    observations: transaction.notes,
  });
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
  return withoutUndefined({
    name: card.name,
    bank: card.bank,
    limit_amount: card.limit,
    due_day: card.dueDay,
    closing_day: card.closingDay,
    interest_rate_month: card.interestRateMonth,
  });
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
  return withoutUndefined({
    card_id: invoice.cardId,
    competence: invoice.competence,
    due_date: invoice.dueDate,
    closing_date: "closingDate" in invoice ? invoice.closingDate ?? null : undefined,
    total_amount: invoice.totalAmount,
    paid_amount: invoice.paidAmount,
    status: invoice.status,
  });
}

export function mapInstallment(row: any): Installment {
  const source = row.installment_source ?? (row.card_id ? "card" : "loan");

  return {
    id: row.id,
    transactionId: row.transaction_id ?? undefined,
    cardId: row.card_id ?? undefined,
    source,
    creditor: row.creditor ?? undefined,
    description: row.description ?? undefined,
    category: row.category ?? undefined,
    purchaseDate: row.purchase_date ?? undefined,
    totalAmount: row.total_amount !== undefined && row.total_amount !== null ? Number(row.total_amount) : undefined,
    downPayment: row.down_payment !== undefined && row.down_payment !== null ? Number(row.down_payment) : undefined,
    competence: row.competence,
    installmentNumber: Number(row.installment_number ?? 1),
    totalInstallments: Number(row.total_installments ?? 1),
    amount: Number(row.amount ?? 0),
    status: row.status ?? "scheduled",
  };
}

export function installmentToRow(installment: Omit<Installment, "id"> | Partial<Installment>) {
  return withoutUndefined({
    transaction_id: "transactionId" in installment ? installment.transactionId ?? null : undefined,
    card_id: "cardId" in installment ? installment.cardId ?? null : undefined,
    installment_source: installment.source,
    creditor: installment.creditor,
    description: installment.description,
    category: installment.category,
    purchase_date: installment.purchaseDate,
    total_amount: installment.totalAmount,
    down_payment: installment.downPayment,
    competence: installment.competence,
    installment_number: installment.installmentNumber,
    total_installments: installment.totalInstallments,
    amount: installment.amount,
    status: installment.status,
  });
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
  return withoutUndefined({
    title: action.title,
    reason: action.reason,
    priority: action.priority,
    horizon: action.horizon,
    expected_savings: action.expectedSavings,
    difficulty: action.difficulty,
    status: action.status,
  });
}
