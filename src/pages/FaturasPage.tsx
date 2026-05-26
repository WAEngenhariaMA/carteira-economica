import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { EmptyState, Panel, StatusPill } from "../components/ui/FinanceUI";
import { invoiceBelongsToCompetence } from "../lib/financeEngine";
import { formatMoney, formatNumberInput, normalizeMoneyInput } from "../lib/formatters";
import { matchesInvoiceSearch } from "../lib/searchFilters";
import { invoiceService } from "../services/invoiceService";
import type { WorkspacePageProps } from "../app/routes";
import type { Invoice } from "../types/finance";

function dueDateForCard(cards: WorkspacePageProps["workspace"]["cards"], cardId: string, competence: string) {
  const card = cards.find((item) => item.id === cardId);
  const [year, month] = competence.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  const dueDay = Math.min(Math.max(card?.dueDay ?? 10, 1), lastDay);

  return `${competence}-${String(dueDay).padStart(2, "0")}`;
}

export function FaturasPage({ userId, competence, workspace, searchQuery, refresh }: WorkspacePageProps) {
  const [editing, setEditing] = useState<Invoice | null>(null);
  const defaultCardId = workspace.cards[0]?.id ?? "";
  const invoices = workspace.invoices.filter((invoice) => {
    const card = workspace.cards.find((item) => item.id === invoice.cardId);
    return invoiceBelongsToCompetence(invoice, competence) && matchesInvoiceSearch(invoice, card, searchQuery);
  });
  const [form, setForm] = useState({ cardId: defaultCardId, totalAmount: "", dueDate: dueDateForCard(workspace.cards, defaultCardId, competence), status: "open" });

  useEffect(() => {
    if (editing) return;
    setForm((current) => ({
      ...current,
      cardId: current.cardId || defaultCardId,
      dueDate: dueDateForCard(workspace.cards, current.cardId || defaultCardId, competence),
    }));
  }, [competence, defaultCardId, editing, workspace.cards]);

  function startEdit(invoice: Invoice) {
    setEditing(invoice);
    setForm({
      cardId: invoice.cardId,
      totalAmount: formatNumberInput(invoice.totalAmount),
      dueDate: invoice.dueDate,
      status: invoice.status,
    });
  }

  function resetForm() {
    setEditing(null);
    setForm({ cardId: defaultCardId, totalAmount: "", dueDate: dueDateForCard(workspace.cards, defaultCardId, competence), status: "open" });
  }

  return (
    <div className="screen-stack">
      <Panel title={editing ? "Editar Fatura" : "Cadastrar Fatura"}>
        <form
          className="entry-form"
          onSubmit={async (event) => {
            event.preventDefault();
            await invoiceService.upsert(userId, {
              id: editing?.id,
              cardId: form.cardId,
              competence: form.dueDate.slice(0, 7) || competence,
              dueDate: form.dueDate,
              totalAmount: Number(form.totalAmount),
              paidAmount: editing?.paidAmount ?? 0,
              closingDate: editing?.closingDate,
              status: form.status as "open" | "closed" | "paid" | "overdue",
            });
            resetForm();
            refresh();
          }}
        >
          <label>
            Cartão
            <select
              value={form.cardId}
              onChange={(event) => setForm({ ...form, cardId: event.target.value, dueDate: dueDateForCard(workspace.cards, event.target.value, competence) })}
              required
            >
              {workspace.cards.map((card) => <option key={card.id} value={card.id}>{card.bank} - {card.name}</option>)}
            </select>
          </label>
          <label>
            Valor
            <input
              value={form.totalAmount}
              type="number"
              min="0"
              step="0.01"
              onBlur={() => setForm({ ...form, totalAmount: normalizeMoneyInput(form.totalAmount) })}
              onChange={(event) => setForm({ ...form, totalAmount: event.target.value })}
              required
            />
          </label>
          <label>
            Vencimento
            <input value={form.dueDate} type="date" onChange={(event) => setForm({ ...form, dueDate: event.target.value })} required />
          </label>
          <label>
            Status
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              <option value="open">Aberta</option>
              <option value="closed">Fechada</option>
              <option value="paid">Paga</option>
              <option value="overdue">Atrasada</option>
            </select>
          </label>
          <div className="form-actions">
            <button className="primary-button" type="submit">{editing ? "Atualizar fatura" : "Salvar fatura"}</button>
            {editing && (
              <button className="ghost-button" type="button" onClick={resetForm}>
                Cancelar edição
              </button>
            )}
          </div>
        </form>
      </Panel>
      <Panel title="Faturas com Vencimento na Competência" className="table-panel">
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Cartão</th>
                <th>Competência financeira</th>
                <th>Ciclo original</th>
                <th>Vencimento</th>
                <th>Status</th>
                <th className="num">Valor</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      title="Nenhuma fatura vence nesta competência"
                      description="Faturas fechadas em um mês entram no fluxo financeiro pelo mês de vencimento, que é quando o dinheiro sai do caixa."
                    />
                  </td>
                </tr>
              )}
              {invoices.map((invoice) => {
                const card = workspace.cards.find((item) => item.id === invoice.cardId);
                return (
                  <tr key={invoice.id}>
                    <td>{card ? `${card.bank} - ${card.name}` : "Cartão removido"}</td>
                    <td>{invoice.dueDate.slice(0, 7)}</td>
                    <td>{invoice.competence}</td>
                    <td>{invoice.dueDate}</td>
                    <td><StatusPill status={invoice.status} /></td>
                    <td className="num">{formatMoney(invoice.totalAmount)}</td>
                    <td className="table-actions">
                      <button className="ghost-button icon-only" type="button" aria-label="Editar fatura" onClick={() => startEdit(invoice)}>
                        <Pencil size={15} />
                      </button>
                      <button
                        className="ghost-button icon-only"
                        type="button"
                        aria-label="Excluir fatura"
                        onClick={async () => {
                          await invoiceService.remove(userId, invoice.id);
                          if (editing?.id === invoice.id) resetForm();
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
