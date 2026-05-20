import { Brain, Download, FileText, Gauge, ListChecks } from "lucide-react";
import { MetricCard, Panel } from "../components/ui/FinanceUI";
import { buildDiagnostics } from "../lib/financeEngine";
import type { WorkspacePageProps } from "../app/routes";

export function RelatoriosPage({ workspace, summary, onReport }: WorkspacePageProps & { onReport: () => void }) {
  return (
    <div className="screen-stack">
      <Panel title="PDF Executivo">
        <div className="report-hero">
          <span className="icon-badge tone-neutral"><FileText size={18} /></span>
          <div>
            <strong>Relatório de consultoria financeira</strong>
            <span>Capa, resumo executivo, indicadores, riscos, cartões, parcelas, plano e alertas.</span>
          </div>
          <button className="primary-button" type="button" onClick={onReport}>
            <Download size={17} />
            Baixar PDF
          </button>
        </div>
      </Panel>
      <div className="kpi-grid compact">
        <MetricCard icon={Gauge} label="Pontuação" value={`${summary.healthScore}/100`} helper="Pontuação atual" tone="warn" />
        <MetricCard icon={Brain} label="Achados" value={`${buildDiagnostics(summary, workspace.cards, workspace.debts).length}`} helper="Regras técnicas ativas" tone="warn" />
        <MetricCard icon={ListChecks} label="Ações" value={`${workspace.actions.length}`} helper="Priorizadas por impacto" tone="good" />
      </div>
    </div>
  );
}
