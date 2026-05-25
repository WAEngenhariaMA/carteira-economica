import { useState } from "react";
import { Banknote, Clock3, Gauge, TrendingUp } from "lucide-react";
import { TransactionForm } from "../components/forms/TransactionForm";
import { MoneyTable } from "../components/tables/MoneyTable";
import { MetricCard, Panel } from "../components/ui/FinanceUI";
import { formatMoney } from "../lib/formatters";
import { transactionService } from "../services/transactionService";
import type { WorkspacePageProps } from "../app/routes";
import type { Transaction } from "../types/finance";

export function ReceitasPage({ userId, competence, workspace, summary, refresh }: WorkspacePageProps) {
  const [editing, setEditing] = useState<Transaction | null>(null);
  const rows = workspace.transactions.filter((item) => item.type === "income");

  return (
    <div className="screen-stack">
      <div className="kpi-grid compact">
        <MetricCard icon={Banknote} label="Receita Recebida no Mês" value={formatMoney(summary.confirmedIncome)} helper="Dinheiro já confirmado no caixa" tone="good" />
        <MetricCard icon={Clock3} label="A Receber no Mês" value={formatMoney(summary.pendingIncome)} helper="Receitas pendentes ou previstas na competência" tone={summary.pendingIncome > 0 ? "warn" : "neutral"} />
        <MetricCard icon={TrendingUp} label="Renda Prevista do Mês" value={formatMoney(summary.expectedIncome)} helper="Recebida + pendente" tone="neutral" />
        <MetricCard icon={Gauge} label="Diferença de Renda" value={formatMoney(Math.max(workspace.profile.idealIncome - summary.expectedIncome, 0))} helper="Distância para conforto" tone="warn" />
      </div>
      <Panel title={editing ? "Editar Receita" : "Cadastrar Receita"}>
        <TransactionForm
          competence={competence}
          type="income"
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
      <Panel title="Receitas Registradas" className="table-panel">
        <MoneyTable
          title="Receitas"
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
