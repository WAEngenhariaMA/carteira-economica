import { AlertTriangle } from "lucide-react";
import { IconBadge, Panel, RiskPill } from "../components/ui/FinanceUI";
import { buildDiagnostics } from "../lib/financeEngine";
import { formatMoney } from "../lib/formatters";
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

  return (
    <div className="screen-stack">
      <div className="dashboard-grid">
        <Panel title="Regra Adaptativa">
          <div className="budget-bars">
            <BudgetBar label="Necessidades" ratio={summary.adaptiveBudget.needs} amount={summary.income * summary.adaptiveBudget.needs} />
            <BudgetBar label="Desejos" ratio={summary.adaptiveBudget.wants} amount={summary.income * summary.adaptiveBudget.wants} />
            <BudgetBar label="Reserva ou divida" ratio={summary.adaptiveBudget.reserveOrDebt} amount={summary.income * summary.adaptiveBudget.reserveOrDebt} />
          </div>
        </Panel>
        <Panel title="Leitura Executiva">
          <div className="score-copy">
            <RiskPill level={summary.riskLevel} />
            <h3>{summary.financialStatus}</h3>
            <p>Diagnostico calculado por regras objetivas. A proxima etapa profissional e persistir esses achados e enviar para uma Edge Function de IA.</p>
          </div>
        </Panel>
      </div>
      <Panel title="Achados Tecnicos">
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
    </div>
  );
}
