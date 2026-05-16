import { Bar } from "react-chartjs-2";
import { CardForm } from "../components/forms/CardForm";
import { chartOptions } from "../components/charts/chartConfig";
import { IconBadge, Panel, RiskPill } from "../components/ui/FinanceUI";
import { formatMoney, formatPercent } from "../lib/formatters";
import { cardService } from "../services/cardService";
import type { WorkspacePageProps } from "../app/routes";
import { CreditCard, Trash2 } from "lucide-react";

export function CartoesPage({ userId, workspace, refresh }: WorkspacePageProps) {
  const invoiceChart = {
    labels: workspace.cards.map((card) => card.bank),
    datasets: [
      { label: "Fatura atual", data: workspace.cards.map((card) => card.currentInvoice), backgroundColor: "#0f766e", borderRadius: 6 },
      { label: "Fatura anterior", data: workspace.cards.map((card) => card.previousInvoice), backgroundColor: "#94a3b8", borderRadius: 6 },
    ],
  };

  return (
    <div className="screen-stack">
      <Panel title="Cadastrar Cartao">
        <CardForm
          onSubmit={async (card) => {
            await cardService.create(userId, card);
            refresh();
          }}
        />
      </Panel>
      <div className="dashboard-grid">
        <Panel title="Analise por Cartao">
          <div className="card-list">
            {workspace.cards.map((card) => {
              const ratio = card.limit > 0 ? card.currentInvoice / card.limit : 0;
              return (
                <article className="credit-row" key={card.id}>
                  <div className="credit-main">
                    <IconBadge icon={CreditCard} tone={ratio > 0.45 ? "danger" : "neutral"} />
                    <div>
                      <strong>{card.bank}</strong>
                      <span>{card.name}</span>
                    </div>
                  </div>
                  <div className="credit-metric">
                    <span>Fatura</span>
                    <strong>{formatMoney(card.currentInvoice)}</strong>
                  </div>
                  <div className="credit-progress">
                    <span>{formatPercent(ratio)} do limite</span>
                    <div><i style={{ width: `${Math.min(ratio * 100, 100)}%` }} /></div>
                  </div>
                  <button
                    className="ghost-button icon-only"
                    type="button"
                    onClick={async () => {
                      await cardService.remove(userId, card.id);
                      refresh();
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </article>
              );
            })}
          </div>
        </Panel>
        <Panel title="Crescimento de Faturas" className="chart-panel">
          <Bar data={invoiceChart} options={chartOptions} />
        </Panel>
      </div>
      <Panel title="Tabela de Risco" className="table-panel">
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Cartao</th>
                <th>Limite</th>
                <th>Fatura</th>
                <th>Vencimento</th>
                <th>Parcelas futuras</th>
                <th>Risco</th>
              </tr>
            </thead>
            <tbody>
              {workspace.cards.map((card) => {
                const ratio = card.limit > 0 ? card.currentInvoice / card.limit : 0;
                return (
                  <tr key={card.id}>
                    <td>
                      <strong>{card.bank}</strong>
                      <span>{card.name}</span>
                    </td>
                    <td>{formatMoney(card.limit)}</td>
                    <td>{formatMoney(card.currentInvoice)}</td>
                    <td>Dia {card.dueDay}</td>
                    <td>{formatMoney(card.futureInstallments.reduce((acc, value) => acc + value, 0))}</td>
                    <td><RiskPill level={ratio > 0.45 ? "critical" : ratio > 0.3 ? "risk" : "attention"} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
