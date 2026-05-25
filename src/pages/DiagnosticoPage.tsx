import { AlertTriangle, BookOpen, Brain, ListChecks } from "lucide-react";
import { IconBadge, Panel, RiskPill } from "../components/ui/FinanceUI";
import { buildAlerts, buildDiagnostics, buildRuleBasedActions } from "../lib/financeEngine";
import { buildFinancialExplanation } from "../lib/financialExplainer";
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
  const alerts = buildAlerts(summary, workspace.cards);
  const suggestedActions = buildRuleBasedActions(summary);
  const explanation = buildFinancialExplanation({
    summary,
    cards: workspace.cards,
    debts: workspace.debts,
    diagnostics,
    actions: suggestedActions,
    alerts,
  });

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
            <p>{explanation.executiveDiagnosis}</p>
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
      <Panel title="Explicação em Português Claro">
        <div className="narrative-stack">
          <div className="narrative-lead">
            <IconBadge icon={Brain} tone={summary.projectedBalance < 0 ? "danger" : "good"} />
            <p>{explanation.simpleMonthSummary}</p>
          </div>
          <div className="narrative-grid">
            <article className="narrative-card">
              <strong>Nota financeira</strong>
              <span>{explanation.scoreExplanation}</span>
            </article>
            <article className="narrative-card">
              <strong>Comprometimento</strong>
              <span>{explanation.commitmentExplanation}</span>
            </article>
            <article className="narrative-card">
              <strong>Saldo do mês</strong>
              <span>{explanation.balanceExplanation}</span>
            </article>
            <article className="narrative-card">
              <strong>Cartões</strong>
              <span>{explanation.cardsExplanation}</span>
            </article>
            <article className="narrative-card">
              <strong>Parcelas futuras</strong>
              <span>{explanation.installmentsExplanation}</span>
            </article>
          </div>
        </div>
      </Panel>
      <div className="dashboard-grid">
        <Panel title="O Que Fazer Primeiro">
          <div className="action-list">
            {explanation.whatToDoFirst.map((action) => (
              <article className="action-row" key={action.title}>
                <div>
                  <strong>{action.title}</strong>
                  <span>{action.reason}</span>
                </div>
                <div className="action-meta">
                  <RiskPill level="attention" label="Prioridade" />
                  <strong>{action.impact}</strong>
                </div>
              </article>
            ))}
          </div>
        </Panel>
        <Panel title="Plano 7, 30 e 90 Dias">
          <div className="narrative-grid one-column">
            {explanation.horizonPlan.map((item) => (
              <article className="narrative-card horizon-card" key={item.horizon}>
                <IconBadge icon={ListChecks} tone={item.horizon === "7 dias" ? "danger" : "neutral"} />
                <div>
                  <strong>{item.horizon}: {item.title}</strong>
                  <span>{item.description}</span>
                  <b>Impacto esperado: {formatMoney(item.expectedImpact)}</b>
                </div>
              </article>
            ))}
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
      <Panel title="Diagnóstico Técnico Detalhado">
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Indicador</th>
                <th>Valor</th>
                <th>Interpretação</th>
              </tr>
            </thead>
            <tbody>
              {explanation.technicalDiagnosis.map((item) => (
                <tr key={item.label}>
                  <td><strong>{item.label}</strong></td>
                  <td>{item.value}</td>
                  <td>{item.interpretation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Termos Financeiros Explicados">
        <div className="narrative-grid">
          {explanation.glossary.map((item) => (
            <article className="narrative-card" key={item.term}>
              <IconBadge icon={BookOpen} tone="neutral" />
              <div>
                <strong>{item.term}</strong>
                <span>{item.explanation}</span>
              </div>
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
