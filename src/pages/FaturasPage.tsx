import { useState } from "react";
import { Panel, RiskPill } from "../components/ui/FinanceUI";
import { formatMoney } from "../lib/formatters";
import { invoiceService } from "../services/invoiceService";
import type { WorkspacePageProps } from "../app/routes";

export function FaturasPage({ userId, competence, workspace, refresh }: WorkspacePageProps) {
  const [form, setForm] = useState({ cardId: workspace.cards[0]?.id ?? "", totalAmount: "", dueDate: `${competence}-10`, status: "open" });

  return (
    <div className="screen-stack">
      <Panel title="Cadastrar ou Atualizar Fatura">
        <form
          className="entry-form"
          onSubmit={async (event) => {
            event.preventDefault();
            await invoiceService.upsert(userId, {
              cardId: form.cardId,
              competence,
              dueDate: form.dueDate,
              totalAmount: Number(form.totalAmount),
              paidAmount: 0,
              status: form.status as "open" | "closed" | "paid" | "overdue",
            });
            setForm((current) => ({ ...current, totalAmount: "" }));
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
          <button className="primary-button" type="submit">Salvar fatura</button>
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
                    <td><RiskPill level={invoice.status === "overdue" ? "critical" : invoice.status === "paid" ? "healthy" : "attention"} label={invoice.status} /></td>
                    <td className="num">{formatMoney(invoice.totalAmount)}</td>
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
