import { Panel } from "../components/ui/FinanceUI";
import { formatMoney, formatPercent } from "../lib/formatters";
import type { WorkspacePageProps } from "../app/routes";

export function ParcelasPage({ summary }: WorkspacePageProps) {
  return (
    <Panel title="Comprometimento Futuro Mes a Mes">
      <div className="timeline">
        {summary.futureCommitments.map((item) => {
          const ratio = summary.income > 0 ? item.total / summary.income : 0;
          return (
            <article className="timeline-row" key={item.month}>
              <div className="timeline-month">
                <strong>{item.month}</strong>
                <span>{formatPercent(ratio)} da renda</span>
              </div>
              <div className="timeline-bar">
                <i style={{ width: `${Math.min(ratio * 100, 100)}%` }} />
              </div>
              <div className="timeline-values">
                <span>Cartao {formatMoney(item.cardInstallments)}</span>
                <span>Fixos {formatMoney(item.fixedExpenses)}</span>
                <span>Dividas {formatMoney(item.debts)}</span>
                <strong>Saldo {formatMoney(item.projectedBalance)}</strong>
              </div>
            </article>
          );
        })}
      </div>
    </Panel>
  );
}
