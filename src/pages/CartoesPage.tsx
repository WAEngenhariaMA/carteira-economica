import { useState } from "react";
import { Bar } from "react-chartjs-2";
import { CardForm } from "../components/forms/CardForm";
import { chartOptions } from "../components/charts/chartConfig";
import { Modal } from "../components/ui/Modal";
import { IconBadge, Panel, RiskPill } from "../components/ui/FinanceUI";
import { formatMoney, formatPercent } from "../lib/formatters";
import { matchesCardSearch } from "../lib/searchFilters";
import { cardService } from "../services/cardService";
import type { WorkspacePageProps } from "../app/routes";
import type { Card } from "../types/finance";
import { CreditCard, Pencil, Trash2 } from "lucide-react";

export function CartoesPage({ userId, competence, workspace, searchQuery, refresh }: WorkspacePageProps) {
  const [editing, setEditing] = useState<Card | null>(null);
  const filteredCards = workspace.cards.filter((card) => matchesCardSearch(card, searchQuery));
  const invoiceChart = {
    labels: filteredCards.map((card) => card.bank),
    datasets: [
      { label: "Fatura atual", data: filteredCards.map((card) => card.currentInvoice), backgroundColor: "#0f766e", borderRadius: 6 },
      { label: "Fatura anterior", data: filteredCards.map((card) => card.previousInvoice), backgroundColor: "#94a3b8", borderRadius: 6 },
    ],
  };

  return (
    <div className="screen-stack">
      <Panel title="Cadastrar Cartão">
        <CardForm
          initialValue={null}
          onSubmit={async (card) => {
            await cardService.create(userId, card);
            refresh();
          }}
        />
      </Panel>

      {editing && (
        <Modal
          title="Editar Cartão"
          subtitle={`${editing.bank} — ${editing.name}`}
          onClose={() => setEditing(null)}
          size="sm"
        >
          <CardForm
            initialValue={editing}
            onCancel={() => setEditing(null)}
            onSubmit={async (card) => {
              await cardService.update(userId, editing.id, card);
              setEditing(null);
              refresh();
            }}
          />
        </Modal>
      )}
      <div className="dashboard-grid">
        <Panel title="Análise por Cartão">
          <div className="card-list">
            {filteredCards.map((card) => {
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
                    <span>Fatura da competência</span>
                    <strong>{formatMoney(card.currentInvoice)}</strong>
                  </div>
                  <div className="credit-progress">
                    <span>{formatPercent(ratio)} do limite</span>
                    <div><i style={{ width: `${Math.min(ratio * 100, 100)}%` }} /></div>
                  </div>
                  <div className="card-actions">
                    <button className="ghost-button icon-only" type="button" aria-label="Editar cartão" onClick={() => setEditing(card)}>
                      <Pencil size={15} />
                    </button>
                    <button
                      className="ghost-button icon-only"
                      type="button"
                      aria-label="Excluir cartão"
                      onClick={async () => {
                        await cardService.remove(userId, card.id);
                        if (editing?.id === card.id) setEditing(null);
                        refresh();
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
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
                <th>Cartão</th>
                <th>Limite</th>
                <th>Fatura</th>
                <th>Vencimento</th>
                <th>Parcelas futuras</th>
                <th>Risco</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredCards.map((card) => {
                const ratio = card.limit > 0 ? card.currentInvoice / card.limit : 0;
                const futureInstallments = card.futureInstallments.slice(1).reduce((acc, value) => acc + value, 0);
                return (
                  <tr key={card.id}>
                    <td>
                      <strong>{card.bank}</strong>
                      <span>{card.name}</span>
                    </td>
                    <td>{formatMoney(card.limit)}</td>
                    <td>{formatMoney(card.currentInvoice)}</td>
                    <td>Dia {card.dueDay}</td>
                    <td>
                      <strong>{formatMoney(futureInstallments)}</strong>
                      <span>Após {competence}</span>
                    </td>
                    <td><RiskPill level={ratio > 0.45 ? "critical" : ratio > 0.3 ? "risk" : "attention"} /></td>
                    <td className="table-actions">
                      <button className="ghost-button icon-only" type="button" aria-label="Editar cartão" onClick={() => setEditing(card)}>
                        <Pencil size={15} />
                      </button>
                      <button
                        className="ghost-button icon-only"
                        type="button"
                        aria-label="Excluir cartão"
                        onClick={async () => {
                          await cardService.remove(userId, card.id);
                          if (editing?.id === card.id) setEditing(null);
                          refresh();
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
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
