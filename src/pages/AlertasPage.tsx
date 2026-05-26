import { Bell } from "lucide-react";
import { IconBadge, Panel, RiskPill } from "../components/ui/FinanceUI";
import { buildAlerts, buildDiagnostics } from "../lib/financeEngine";
import { buildFinancialExplanation } from "../lib/financialExplainer";
import { alertSourceLabel } from "../lib/formatters";
import type { WorkspacePageProps } from "../app/routes";

export function AlertasPage({ workspace, summary }: WorkspacePageProps) {
  const alerts = buildAlerts(summary, workspace.cards);
  const diagnostics = buildDiagnostics(summary, workspace.cards, workspace.debts);
  const explanation = buildFinancialExplanation({
    summary,
    cards: workspace.cards,
    debts: workspace.debts,
    diagnostics,
    actions: workspace.actions,
    alerts,
  });

  return (
    <div className="screen-stack">
      <Panel title="Alertas em Linguagem Simples">
        <div className="narrative-grid">
          {explanation.plainLanguageAlerts.map((message) => (
            <article className="narrative-card" key={message}>
              <IconBadge icon={Bell} tone={summary.projectedBalance < 0 ? "danger" : "warn"} />
              <span>{message}</span>
            </article>
          ))}
        </div>
      </Panel>
      <div className="alert-grid">
        {alerts.map((alert) => (
          <article className={`alert-card risk-${alert.level}`} key={alert.id}>
            <IconBadge icon={Bell} tone={alert.level === "critical" ? "danger" : "warn"} />
            <div>
              <RiskPill level={alert.level} />
              <h3>{alert.title}</h3>
              <p>{alert.simpleExplanation ?? alert.message}</p>
              {alert.ignoredRisk && <p><strong>Risco se ignorar:</strong> {alert.ignoredRisk}</p>}
              {alert.recommendedAction && <p><strong>Ação recomendada:</strong> {alert.recommendedAction}</p>}
              <span>{alertSourceLabel(alert.source)} {alert.estimatedImpact ? `| impacto ${alert.estimatedImpact.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` : ""}</span>
            </div>
          </article>
        ))}
        {alerts.length === 0 && (
          <article className="alert-card">
            <IconBadge icon={Bell} tone="good" />
            <div>
              <RiskPill level="healthy" />
              <h3>Nenhum alerta crítico</h3>
              <p>A base atual não aponta vencimentos, duplicidades ou pressão crítica.</p>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
