import { useState } from "react";
import { ReceiptText, ShieldAlert, SlidersHorizontal } from "lucide-react";
import { TransactionForm } from "../components/forms/TransactionForm";
import { MoneyTable } from "../components/tables/MoneyTable";
import { MetricCard, Panel } from "../components/ui/FinanceUI";
import { formatMoney } from "../lib/formatters";
import { transactionService } from "../services/transactionService";
import type { WorkspacePageProps } from "../app/routes";
import type { Transaction } from "../types/finance";

export function DespesasPage({ userId, competence, workspace, summary, refresh }: WorkspacePageProps) {
  const [editing, setEditing] = useState<Transaction | null>(null);
  const rows = workspace.transactions.filter((item) => item.type === "expense");
  const cuttable = rows
    .filter((item) => item.essentiality === "superfluous" || item.essentiality === "impulsive")
    .reduce((total, item) => total + item.amount, 0);

  return (
    <div className="screen-stack">
      <div className="kpi-grid compact">
        <MetricCard icon={ReceiptText} label="Despesas Diretas" value={formatMoney(summary.directFixedExpenses + summary.directVariableExpenses)} helper="Fora cartao" tone="neutral" />
        <MetricCard icon={SlidersHorizontal} label="Cortavel" value={formatMoney(cuttable)} helper="Superfluo e impulsivo" tone="good" />
        <MetricCard icon={ShieldAlert} label="Impacto Cartao" value={formatMoney(summary.cardInvoices)} helper="Fatura consolidada" tone="danger" />
      </div>
      <Panel title={editing ? "Editar Despesa" : "Cadastrar Despesa"}>
        <TransactionForm
          competence={competence}
          type="expense"
          initialValue={editing}
          onCancel={() => setEditing(null)}
          onSubmit={async (transaction) => {
            if (editing) {
              await transactionService.update(userId, editing.id, transaction);
              setEditing(null);
            } else {
              await transactionService.create(userId, transaction);
            }
            refresh();
          }}
        />
      </Panel>
      <Panel title="Despesas Classificadas" className="table-panel">
        <MoneyTable
          title="Despesas"
          rows={rows}
          onEdit={setEditing}
          onDelete={async (id) => {
            await transactionService.remove(userId, id);
            if (editing?.id === id) setEditing(null);
            refresh();
          }}
        />
      </Panel>
    </div>
  );
}
