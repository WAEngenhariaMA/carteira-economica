import { useState } from "react";
import { CalendarClock, Clock3, ReceiptText, ShieldAlert, SlidersHorizontal } from "lucide-react";
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
        <MetricCard icon={ReceiptText} label="Despesas Pagas no Mês" value={formatMoney(summary.paidDirectExpenses)} helper="Saídas diretas já realizadas" tone="neutral" />
        <MetricCard icon={Clock3} label="Pendentes do Mês" value={formatMoney(summary.pendingDirectExpenses)} helper="Despesas diretas abertas ou agendadas" tone={summary.pendingDirectExpenses > 0 ? "warn" : "good"} />
        <MetricCard icon={CalendarClock} label="Compromissos Futuros" value={formatMoney(summary.futureCommitmentsTotal)} helper="Próximos 5 meses, sem o mês atual" tone={summary.futureCommitmentsTotal > 0 ? "warn" : "good"} />
        <MetricCard icon={SlidersHorizontal} label="Cortável no Mês" value={formatMoney(cuttable)} helper="Supérfluo e impulsivo da competência" tone="good" />
        <MetricCard icon={ShieldAlert} label="Impacto do Cartão no Mês" value={formatMoney(summary.cardInvoices)} helper={`Em aberto ${formatMoney(summary.openCardInvoices)}`} tone="danger" />
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
