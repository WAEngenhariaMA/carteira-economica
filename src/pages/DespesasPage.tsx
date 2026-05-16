import { ReceiptText, ShieldAlert, SlidersHorizontal } from "lucide-react";
import { TransactionForm } from "../components/forms/TransactionForm";
import { MoneyTable } from "../components/tables/MoneyTable";
import { MetricCard, Panel } from "../components/ui/FinanceUI";
import { formatMoney } from "../lib/formatters";
import { transactionService } from "../services/transactionService";
import type { WorkspacePageProps } from "../app/routes";

export function DespesasPage({ userId, competence, workspace, summary, refresh }: WorkspacePageProps) {
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
      <Panel title="Cadastrar Despesa">
        <TransactionForm
          competence={competence}
          type="expense"
          onSubmit={async (transaction) => {
            await transactionService.create(userId, transaction);
            refresh();
          }}
        />
      </Panel>
      <Panel title="Despesas Classificadas" className="table-panel">
        <MoneyTable
          title="Despesas"
          rows={rows}
          onDelete={async (id) => {
            await transactionService.remove(userId, id);
            refresh();
          }}
        />
      </Panel>
    </div>
  );
}
