import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Panel, StatusPill } from "../components/ui/FinanceUI";
import { formatMoney } from "../lib/formatters";
import { invoiceService } from "../services/invoiceService";
import type { WorkspacePageProps } from "../app/routes";
import type { Invoice } from "../types/finance";

export function FaturasPage({ userId, competence, workspace, refresh }: WorkspacePageProps) {
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [form, setForm] = useState({ cardId: workspace.cards[0]?.id ?? "", totalAmount: "", dueDate: `${competence}-10`, status: "open" });

  function startEdit(invoice: Invoice) {
    setEditing(invoice);
    setForm({
      cardId: invoice.cardId,
      totalAmount: String(invoice.totalAmount),
      dueDate: invoice.dueDate,
      status: invoice.status,
    });
  }

  function resetForm() {
    setEditing(null);
    setForm({ cardId: workspace.cards[0]?.id ?? "", totalAmount: "", dueDate: `${competence}-10`, status: "open" });
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
              competence,
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
            Cartao
            <select value={form.cardId} onChange={(event) => setForm({ ...form, cardId: event.target.value })} required>
              {workspace.cards.map((card) => <option key={card.id} value={card.id}>{card.bank} - {card.name}</option>)}
            </select>
          </label>
          <label>
            Valor
            <input value={form.totalAmount} type="number" min="0" step="0.01" onChange={(event) => setForm({ ...form, totalAmount: event.target.value })} required />
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
                Cancelar edicao
              </button>
            )}
          </div>
        </form>
      </Panel>
      <Panel title="Faturas da Competencia" className="table-panel">
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Cartao</th>
                <th>Competencia</th>
                <th>Vencimento</th>
                <th>Status</th>
                <th className="num">Valor</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {workspace.invoices.map((invoice) => {
                const card = workspace.cards.find((item) => item.id === invoice.cardId);
                return (
                  <tr key={invoice.id}>
                    <td>{card ? `${card.bank} - ${card.name}` : "Cartao removido"}</td>
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
