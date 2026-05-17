export type TransactionType = "income" | "expense";
export type Essentiality = "essential" | "important" | "superfluous" | "impulsive";
export type PaymentRail = "bank" | "card" | "cash" | "loan";
export type RiskLevel = "excellent" | "healthy" | "attention" | "risk" | "critical" | "emergency";
export type ActionStatus = "planned" | "running" | "done";
export type ActionPriority = "urgent" | "high" | "medium" | "low";
export type ScreenId =
  | "dashboard"
  | "receitas"
  | "despesas"
  | "cartoes"
  | "faturas"
  | "parcelas"
  | "importador"
  | "diagnostico"
  | "plano"
  | "metas"
  | "alertas"
  | "simulador"
  | "relatorios"
  | "configuracoes";

export interface FinancialProfile {
  id: string;
  ownerName: string;
  householdName: string;
  monthlyIncomeTarget: number;
  currentReserve: number;
  reserveTarget: number;
  idealIncome: number;
  riskTolerance: "low" | "medium" | "high";
  preferredRule: "50-30-20" | "60-25-15" | "70-10-20";
}

export interface Transaction {
  id: string;
  date: string;
  competence: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  subcategory: string;
  essentiality: Essentiality;
  recurring: boolean;
  fixed: boolean;
  paymentRail: PaymentRail;
  bank: string;
  cardId?: string;
  installment?: number;
  totalInstallments?: number;
  status: "paid" | "open" | "scheduled";
  priority: "mandatory" | "adjustable" | "cuttable" | "renegotiable";
  impact: "low" | "medium" | "high" | "severe";
  notes?: string;
}

export interface Card {
  id: string;
  name: string;
  bank: string;
  limit: number;
  currentInvoice: number;
  previousInvoice: number;
  dueDay: number;
  closingDay: number;
  futureInstallments: number[];
  interestRateMonth: number;
}

export interface Invoice {
  id: string;
  cardId: string;
  competence: string;
  dueDate: string;
  closingDate?: string;
  totalAmount: number;
  paidAmount: number;
  status: "open" | "closed" | "paid" | "overdue";
}

export interface Installment {
  id: string;
  transactionId?: string;
  cardId?: string;
  description?: string;
  category?: string;
  purchaseDate?: string;
  totalAmount?: number;
  downPayment?: number;
  competence: string;
  installmentNumber: number;
  totalInstallments: number;
  amount: number;
  status: "scheduled" | "open" | "paid";
}

export interface InstallmentPurchaseInput {
  cardId: string;
  description: string;
  category: string;
  purchaseDate: string;
  firstCompetence: string;
  totalAmount: number;
  downPayment: number;
  totalInstallments: number;
}

export interface Debt {
  id: string;
  creditor: string;
  type: "loan" | "credit_card" | "overdraft" | "financing";
  balance: number;
  monthlyPayment: number;
  interestRateMonth: number;
  monthsLeft: number;
  renegotiable: boolean;
}

export interface Investment {
  id: string;
  name: string;
  type: "reserve" | "fixed_income" | "fund" | "stock";
  amount: number;
  liquidityDays: number;
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline: string;
  priority: ActionPriority;
}

export interface AlertItem {
  id: string;
  title: string;
  message: string;
  level: Exclude<RiskLevel, "excellent" | "healthy">;
  source: "cashflow" | "card" | "installments" | "budget" | "data";
}

export interface ActionItem {
  id: string;
  title: string;
  reason: string;
  priority: ActionPriority;
  horizon: "7 dias" | "30 dias" | "60 dias" | "90 dias";
  expectedSavings: number;
  difficulty: "baixa" | "media" | "alta";
  status: ActionStatus;
}

export interface DiagnosticFinding {
  id: string;
  title: string;
  description: string;
  severity: Exclude<RiskLevel, "excellent" | "healthy">;
  metric: string;
}

export interface ImportBatch {
  id: string;
  fileName: string;
  sourceType: "csv" | "xlsx" | "manual";
  columnMapping: Record<string, string>;
  status: "pending_validation" | "validated" | "imported" | "failed";
  rowsTotal: number;
  rowsImported: number;
  createdAt: string;
}

export interface DataQualityIssue {
  rowIndex?: number;
  field: string;
  message: string;
  severity: "warning" | "error";
}

export interface FinancialWorkspace {
  profile: FinancialProfile;
  transactions: Transaction[];
  cards: Card[];
  invoices: Invoice[];
  installments: Installment[];
  debts: Debt[];
  investments: Investment[];
  goals: Goal[];
  actions: ActionItem[];
}

export interface MonthlyCommitment {
  month: string;
  cardInstallments: number;
  fixedExpenses: number;
  debts: number;
  total: number;
  projectedBalance: number;
}

export interface BudgetRule {
  needs: number;
  wants: number;
  reserveOrDebt: number;
  label: string;
}

export interface FinancialSummary {
  income: number;
  directFixedExpenses: number;
  directVariableExpenses: number;
  cardInvoices: number;
  debtPayments: number;
  totalOutflow: number;
  projectedBalance: number;
  committedIncomeRatio: number;
  cardIncomeRatio: number;
  debtRatio: number;
  savingsCapacity: number;
  potentialSavings: number;
  dailyAverageSpend: number;
  weeklyAverageSpend: number;
  freeUntilMonthEnd: number;
  healthScore: number;
  riskLevel: RiskLevel;
  financialStatus: string;
  adaptiveBudget: BudgetRule;
  futureCommitments: MonthlyCommitment[];
}
