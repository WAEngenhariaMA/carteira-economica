import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { InstallmentEditForm } from "../components/forms/InstallmentEditForm";
import { InstallmentPurchaseForm } from "../components/forms/InstallmentPurchaseForm";
import { Panel, StatusPill } from "../components/ui/FinanceUI";
import { formatMoney, formatPercent } from "../lib/formatters";
import { installmentService } from "../services/installmentService";
import type { WorkspacePageProps } from "../app/routes";
import type { Installment } from "../types/finance";

export function ParcelasPage({ userId, competence, workspace, summary, refresh }: WorkspacePageProps) {
  const [editing, setEditing] = useState<Installment | null>(null);

  return (
    <div className="screen-stack">
      <Panel title="Cadastrar Compra Parcelada">
        <InstallmentPurchaseForm
          cards={workspace.cards}
          competence={competence}
          onSubmit={async (purchase) => {
            await installmentService.createPurchase(userId, purchase);
            refresh();
          }}
        />
      </Panel>

      {editing && (
        <Panel title="Editar Parcela">
          <InstallmentEditForm
            cards={workspace.cards}
            installment={editing}
            onCancel={() => setEditing(null)}
            onSubmit={async (installment) => {
              await installmentService.update(userId, editing.id, installment);
              setEditing(null);
              refresh();
            }}
          />
        </Panel>
      )}

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

      <Panel title="Parcelamentos Cadastrados" className="table-panel">
        <div className="data-table-wrap">
          <table className="data-table installment-table">
            <thead>
              <tr>
                <th>Compra</th>
                <th>Cartao</th>
                <th>Competencia</th>
                <th>Parcela</th>
                <th>Status</th>
                <th className="num">Valor</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {workspace.installments.map((installment) => {
                const card = workspace.cards.find((item) => item.id === installment.cardId);
                return (
                  <tr key={installment.id}>
                    <td>
                      <strong>{installment.description ?? "Compra parcelada"}</strong>
                      <span>{installment.category ?? "Sem categoria"}</span>
                    </td>
                    <td>{card ? `${card.bank} - ${card.name}` : "Cartao removido"}</td>
                    <td>{installment.competence}</td>
                    <td>{installment.installmentNumber}/{installment.totalInstallments}</td>
                    <td><StatusPill status={installment.status} /></td>
                    <td className="num">{formatMoney(installment.amount)}</td>
                    <td className="table-actions">
                      <button className="ghost-button icon-only" type="button" aria-label="Editar parcela" onClick={() => setEditing(installment)}>
                        <Pencil size={15} />
                      </button>
                      <button
                        className="ghost-button icon-only"
                        type="button"
                        aria-label="Excluir parcela"
                        onClick={async () => {
                          await installmentService.remove(userId, installment.id);
                          if (editing?.id === installment.id) setEditing(null);
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
