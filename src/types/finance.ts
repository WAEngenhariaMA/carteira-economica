export type TransactionType = "income" | "expense";
export type CategoryType =
  | "income"
  | "expense"
  | "investment"
  | "debt"
  | "transfer";
export type Essentiality =
  | "essential"
  | "important"
  | "adjustable"
  | "superfluous"
  | "impulsive";
export type PaymentRail = "bank" | "card" | "cash" | "loan";
export type RiskLevel =
  | "excellent"
  | "healthy"
  | "attention"
  | "risk"
  | "critical"
  | "emergency";
export type ActionStatus = "planned" | "running" | "done";
export type ActionPriority = "urgent" | "high" | "medium" | "low";
export type InstallmentSource = "card" | "loan";
export type FinancialSituation =
  | "healthy"
  | "tight"
  | "indebted"
  | "reorganizing"
  | "investing";
export type MainFinancialObjective =
  | "pay_debts"
  | "organize_spending"
  | "build_reserve"
  | "invest"
  | "buy_asset"
  | "reduce_cards";
export type ScreenId =
  | "dashboard"
  | "indicadores"
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

export interface FinancialCategory {
  id: string;
  name: string;
  type: CategoryType;
  essentiality: Essentiality;
  parentId?: string;
  parentName?: string;
  color: string;
  icon: string;
  monthlyLimit: number;
  keywords: string[];
  isDefault: boolean;
  isActive: boolean;
}

export interface FinancialProfile {
  id: string;
  ownerName: string;
  householdName: string;
  monthlyIncomeTarget: number;
  currentReserve: number;
  reserveTarget: number;
  idealIncome: number;
  riskTolerance: "low" | "medium" | "high";
  preferredRule: "50-30-20" | "60-25-15" | "70-10-20" | "80-5-15";
  currentSituation: FinancialSituation;
  mainObjective: MainFinancialObjective;
  reserveMonthsDesired: 3 | 6 | 12;
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
  sourceDate?: string;
  sourceCompetence?: string;
  projectedFromRecurring?: boolean;
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
  source: InstallmentSource;
  creditor?: string;
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
  source: InstallmentSource;
  cardId?: string;
  creditor?: string;
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
  category?: string;
  simpleExplanation?: string;
  ignoredRisk?: string;
  recommendedAction?: string;
  suggestedDeadline?: "today" | "sevenDays" | "thirtyDays" | "ninetyDays";
  estimatedImpact?: number;
  diagnosticId?: string;
  actionId?: string;
}

export interface ActionItem {
  id: string;
  title: string;
  reason: string;
  priority: ActionPriority;
  horizon: "Hoje" | "7 dias" | "30 dias" | "60 dias" | "90 dias";
  expectedSavings: number;
  difficulty: "baixa" | "media" | "alta";
  status: ActionStatus;
  firstStep?: string;
  scoreImpact?: number;
  dependsOn?: string;
  diagnosticId?: string;
}

export interface DiagnosticFinding {
  id: string;
  title: string;
  description: string;
  severity: Exclude<RiskLevel, "excellent" | "healthy">;
  metric: string;
  category: string;
  currentValue: number;
  recommendedValue: number;
  deviation: number;
  meaning: string;
  risk: string;
  recommendedAction: string;
  deadline: "today" | "sevenDays" | "thirtyDays" | "ninetyDays";
  estimatedImpact: number;
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
  id?: string;
  source?:
    | "profile"
    | "transaction"
    | "invoice"
    | "installment"
    | "card"
    | "category"
    | "debt";
  entityId?: string;
  impact?: string;
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
  categories: FinancialCategory[];
}

export interface MonthlyCommitment {
  month: string;
  competence: string;
  receivedIncome: number;
  pendingIncome: number;
  expectedIncome: number;
  paidFixedExpenses: number;
  openFixedExpenses: number;
  paidVariableExpenses: number;
  openVariableExpenses: number;
  variableExpenses: number;
  cardInvoices: number;
  cardInstallments: number;
  nonInvoicedCardInstallments: number;
  fixedExpenses: number;
  debts: number;
  loanInstallments: number;
  programmedInvestments: number;
  programmedReserve: number;
  mandatoryCommitments: number;
  total: number;
  projectedBalance: number;
}

export interface BudgetRule {
  needs: number;
  wants: number;
  reserveOrDebt: number;
  label: string;
  explanation: string;
}

export interface ScoreFactor {
  id: string;
  label: string;
  points: number;
  currentValue: number;
  recommendedValue: number;
  explanation: string;
}

export interface ReserveTargets {
  essentialMonthlyCost: number;
  minimum: number;
  comfortable: number;
  robust: number;
  selectedMonths: 3 | 6 | 12;
  selectedTarget: number;
  explanation: string;
  hasEnoughData: boolean;
}

export interface IdealIncomeCalculation {
  amount: number;
  explanation: string;
  hasEnoughData: boolean;
}

export interface FinancialHighlight {
  label: string;
  value: string;
  amount: number;
}

export interface FinancialSummary {
  income: number;
  confirmedIncome: number;
  pendingIncome: number;
  expectedIncome: number;
  directFixedExpenses: number;
  directVariableExpenses: number;
  paidDirectExpenses: number;
  pendingDirectExpenses: number;
  cardInvoices: number;
  openCardInvoices: number;
  paidCardInvoices: number;
  debtPayments: number;
  debtMonthlyPayments: number;
  loanInstallments: number;
  paidLoanInstallments: number;
  pendingLoanInstallments: number;
  totalOutflow: number;
  projectedBalance: number;
  realizedBalance: number;
  immediateObligations: number;
  monthlyOpenObligations: number;
  nextMonthCommitment: number;
  futureCommitmentsTotal: number;
  futureInstallmentsTotal: number;
  cashShortfall: number;
  pendingIncomeRatio: number;
  pendingExpenseRatio: number;
  committedIncomeRatio: number;
  cardIncomeRatio: number;
  debtRatio: number;
  essentialExpenseRatio: number;
  variableExpenseRatio: number;
  reserveDebtInvestmentRatio: number;
  cardWeightRatio: number;
  monthsCommittedCount: number;
  savingsCapacity: number;
  potentialSavings: number;
  dailyAverageSpend: number;
  weeklyAverageSpend: number;
  safeDailySpend: number;
  safeWeeklySpend: number;
  moneyLastsDays: number;
  urgentAmount: number;
  freeUntilMonthEnd: number;
  healthScore: number;
  scoreFactors: ScoreFactor[];
  riskLevel: RiskLevel;
  financialStatus: string;
  adaptiveBudget: BudgetRule;
  futureCommitments: MonthlyCommitment[];
  topCardRisk?: FinancialHighlight;
  topCategory?: FinancialHighlight;
  biggestLeak?: FinancialHighlight;
  mostHarmfulExpense?: FinancialHighlight;
  reserveTargets: ReserveTargets;
  automaticIdealIncome: IdealIncomeCalculation;
  dataQualityIssues: DataQualityIssue[];
  dataQualityScore: number;
  dataReliabilityLabel: string;
}
