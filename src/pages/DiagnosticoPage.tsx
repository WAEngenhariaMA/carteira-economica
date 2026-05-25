import { AlertTriangle } from "lucide-react";
import { IconBadge, Panel, RiskPill } from "../components/ui/FinanceUI";
import { buildDiagnostics, buildRuleBasedActions } from "../lib/financeEngine";
import { formatMoney, formatPercent } from "../lib/formatters";
import type { WorkspacePageProps } from "../app/routes";

function BudgetBar({ label, ratio, amount }: { label: string; ratio: number; amount: number }) {
  return (
    <div className="budget-row">
      <div>
        <strong>{label}</strong>
        <span>{formatMoney(amount)}</span>
      </div>
      <div className="budget-track">
        <i style={{ width: `${ratio * 100}%` }} />
      </div>
      <b>{Math.round(ratio * 100)}%</b>
    </div>
  );
}

export function DiagnosticoPage({ workspace, summary }: WorkspacePageProps) {
  const diagnostics = buildDiagnostics(summary, workspace.cards, workspace.debts);
  const suggestedActions = buildRuleBasedActions(summary);

  return (
    <div className="screen-stack">
      <div className="dashboard-grid">
        <Panel title="Regra Adaptativa">
          <div className="budget-bars">
            <BudgetBar label="Necessidades" ratio={summary.adaptiveBudget.needs} amount={summary.income * summary.adaptiveBudget.needs} />
            <BudgetBar label="Desejos" ratio={summary.adaptiveBudget.wants} amount={summary.income * summary.adaptiveBudget.wants} />
            <BudgetBar label="Reserva ou dívida" ratio={summary.adaptiveBudget.reserveOrDebt} amount={summary.income * summary.adaptiveBudget.reserveOrDebt} />
          </div>
        </Panel>
        <Panel title="Leitura Executiva">
          <div className="score-copy">
            <RiskPill level={summary.riskLevel} />
            <h3>{summary.financialStatus}</h3>
            <p>
              Diagnóstico gerencial do mês selecionado, com leitura separada de caixa recebido, contas abertas,
              faturas e dívidas. A exposição futura aparece como tendência, sem inflar os cards mensais.
            </p>
            <div className="rule-row">
              <span>A receber</span>
              <strong>{formatPercent(summary.pendingIncomeRatio)}</strong>
            </div>
            <div className="rule-row">
              <span>Pendências sobre saídas</span>
              <strong>{formatPercent(summary.pendingExpenseRatio)}</strong>
            </div>
            <div className="rule-row">
              <span>Próximos 5 meses</span>
              <strong>{formatMoney(summary.futureCommitmentsTotal)}</strong>
            </div>
          </div>
        </Panel>
      </div>
      <Panel title="Achados Técnicos">
        <div className="diagnostic-grid">
          {diagnostics.map((item) => (
            <article className="diagnostic-card" key={item.id}>
              <div>
                <IconBadge icon={AlertTriangle} tone={item.severity === "critical" ? "danger" : "warn"} />
                <RiskPill level={item.severity} />
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <span>{item.metric}</span>
            </article>
          ))}
        </div>
      </Panel>
      <Panel title="Plano Gerencial Sugerido">
        <div className="action-list">
          {suggestedActions.map((action) => (
            <article className="action-row" key={action.id}>
              <div>
                <strong>{action.title}</strong>
                <span>{action.reason}</span>
              </div>
              <div className="action-meta">
                <RiskPill level={action.priority} label={action.horizon} />
                <strong>{formatMoney(action.expectedSavings)}</strong>
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}
