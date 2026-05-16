import { Banknote, TrendingUp, Gauge } from "lucide-react";
import { TransactionForm } from "../components/forms/TransactionForm";
import { MoneyTable } from "../components/tables/MoneyTable";
import { MetricCard, Panel } from "../components/ui/FinanceUI";
import { formatMoney } from "../lib/formatters";
import { transactionService } from "../services/transactionService";
import type { WorkspacePageProps } from "../app/routes";

export function ReceitasPage({ userId, competence, workspace, summary, refresh }: WorkspacePageProps) {
  const rows = workspace.transactions.filter((item) => item.type === "income");

  return (
    <div className="screen-stack">
      <div className="kpi-grid compact">
        <MetricCard icon={Banknote} label="Receita Confirmada" value={formatMoney(summary.income)} helper="Entradas no mes" tone="good" />
        <MetricCard icon={TrendingUp} label="Renda Ideal" value={formatMoney(workspace.profile.idealIncome)} helper="Para regra confortavel" tone="neutral" />
        <MetricCard icon={Gauge} label="Gap de Renda" value={formatMoney(Math.max(workspace.profile.idealIncome - summary.income, 0))} helper="Distancia para conforto" tone="warn" />
      </div>
      <Panel title="Cadastrar Receita">
        <TransactionForm
          competence={competence}
          type="income"
          onSubmit={async (transaction) => {
            await transactionService.create(userId, transaction);
            refresh();
          }}
        />
      </Panel>
      <Panel title="Receitas Registradas" className="table-panel">
        <MoneyTable
          title="Receitas"
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
