import { Bell } from "lucide-react";
import { IconBadge, RiskPill } from "../components/ui/FinanceUI";
import { buildAlerts } from "../lib/financeEngine";
import type { WorkspacePageProps } from "../app/routes";

export function AlertasPage({ workspace, summary }: WorkspacePageProps) {
  const alerts = buildAlerts(summary, workspace.cards);

  return (
    <div className="alert-grid">
      {alerts.map((alert) => (
        <article className={`alert-card risk-${alert.level}`} key={alert.id}>
          <IconBadge icon={Bell} tone={alert.level === "critical" ? "danger" : "warn"} />
          <div>
            <RiskPill level={alert.level} />
            <h3>{alert.title}</h3>
            <p>{alert.message}</p>
            <span>{alert.source}</span>
          </div>
        </article>
      ))}
      {alerts.length === 0 && (
        <article className="alert-card">
          <IconBadge icon={Bell} tone="good" />
          <div>
            <RiskPill level="healthy" />
            <h3>Nenhum alerta critico</h3>
            <p>A base atual nao aponta vencimentos, duplicidades ou pressao critica.</p>
          </div>
        </article>
      )}
    </div>
  );
}
