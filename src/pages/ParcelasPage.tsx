import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { InstallmentEditForm } from "../components/forms/InstallmentEditForm";
import { InstallmentPurchaseForm } from "../components/forms/InstallmentPurchaseForm";
import { EmptyState, Panel, StatusPill } from "../components/ui/FinanceUI";
import { formatMoney, formatPercent } from "../lib/formatters";
import { installmentService } from "../services/installmentService";
import type { WorkspacePageProps } from "../app/routes";
import type { Installment } from "../types/finance";

export function ParcelasPage({ userId, competence, workspace, summary, refresh }: WorkspacePageProps) {
  const [editing, setEditing] = useState<Installment | null>(null);
  const sortedInstallments = [...workspace.installments].sort(
    (a, b) => a.competence.localeCompare(b.competence) || a.installmentNumber - b.installmentNumber,
  );
  const currentInstallments = sortedInstallments.filter((installment) => installment.competence === competence);
  const futureInstallments = sortedInstallments.filter((installment) => installment.competence > competence);

  function renderInstallmentRows(installments: Installment[]) {
    if (installments.length === 0) {
      return (
        <tr>
          <td colSpan={7}>
            <EmptyState
              title="Nenhuma parcela nesta visão"
              description="O filtro de competência está sendo respeitado. Cadastre um parcelamento ou altere a competência para ver outros meses."
            />
          </td>
        </tr>
      );
    }

    return installments.map((installment) => {
      const card = workspace.cards.find((item) => item.id === installment.cardId);
      const isLoan = installment.source === "loan" || !installment.cardId;
      return (
        <tr key={installment.id}>
          <td>
            <strong>{installment.description ?? (isLoan ? "Empréstimo parcelado" : "Compra parcelada")}</strong>
            <span>{installment.category ?? "Sem categoria"}</span>
          </td>
          <td>
            {isLoan
              ? `Empréstimo${installment.creditor ? ` - ${installment.creditor}` : ""}`
              : card ? `${card.bank} - ${card.name}` : "Cartão removido"}
          </td>
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
    });
  }

  return (
    <div className="screen-stack">
      <Panel title="Cadastrar Parcelamento">
        <InstallmentPurchaseForm
          cards={workspace.cards}
          debts={workspace.debts}
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
            debts={workspace.debts}
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

      <Panel title="Comprometimento Mensal a Partir da Competência">
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
                  <span>Faturas/cartões {formatMoney(item.cardInvoices)}</span>
                  <span>Fixos {formatMoney(item.fixedExpenses)}</span>
                  <span>Variáveis {formatMoney(item.variableExpenses)}</span>
                  <span>Empréstimos {formatMoney(item.loanInstallments)}</span>
                  <span>Dívidas {formatMoney(item.debts)}</span>
                  <strong>Saldo {formatMoney(item.projectedBalance)}</strong>
                </div>
              </article>
            );
          })}
        </div>
      </Panel>

      <Panel title="Parcelas da Competência Selecionada" className="table-panel">
        <div className="data-table-wrap">
          <table className="data-table installment-table">
            <thead>
              <tr>
                <th>Contrato / compra</th>
                <th>Origem</th>
                <th>Competência</th>
                <th>Parcela</th>
                <th>Status</th>
                <th className="num">Valor</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>{renderInstallmentRows(currentInstallments)}</tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Parcelas Futuras Após a Competência" className="table-panel">
        <div className="data-table-wrap">
          <table className="data-table installment-table">
            <thead>
              <tr>
                <th>Contrato / compra</th>
                <th>Origem</th>
                <th>Competência</th>
                <th>Parcela</th>
                <th>Status</th>
                <th className="num">Valor</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>{renderInstallmentRows(futureInstallments)}</tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
