import {
  CalendarDays,
  Clock3,
  CreditCard,
  Gauge,
  ListChecks,
  PiggyBank,
  ReceiptText,
  Rows3,
  ShieldAlert,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { WorkspacePageProps } from "../app/routes";
import { MetricCard, Panel } from "../components/ui/FinanceUI";
import { buildAlerts, buildDiagnostics } from "../lib/financeEngine";
import { buildFinancialExplanation } from "../lib/financialExplainer";
import { formatMoney } from "../lib/formatters";

export function IndicadoresPage({ summary, workspace }: WorkspacePageProps) {
  const diagnostics = buildDiagnostics(summary, workspace.cards, workspace.debts);
  const alerts = buildAlerts(summary, workspace.cards);
  const explanation = buildFinancialExplanation({
    summary,
    cards: workspace.cards,
    debts: workspace.debts,
    diagnostics,
    actions: workspace.actions,
    alerts,
  });
  const shortfallLabel = summary.projectedBalance < 0
    ? `Faltam ${formatMoney(Math.abs(summary.projectedBalance))}`
    : "Mês fecha positivo";
  const urgentAction = explanation.whatToDoFirst[0]?.title ?? "Manter revisão semanal";

  return (
    <div className="screen-stack">
      <Panel title="Indicadores de decisão">
        <div className="kpi-grid compact">
          <MetricCard icon={ReceiptText} label="Dívidas e Empréstimos" value={formatMoney(summary.debtPayments)} helper="Obrigações financeiras da competência" tone={summary.debtPayments > 0 ? "warn" : "good"} />
          <MetricCard icon={Target} label="Quanto falta para fechar" value={summary.projectedBalance < 0 ? formatMoney(Math.abs(summary.projectedBalance)) : formatMoney(0)} helper={summary.projectedBalance < 0 ? "Sem usar crédito, reserva ou atraso" : "Não há falta no saldo previsto"} tone={summary.projectedBalance < 0 ? "danger" : "good"} />
          <MetricCard icon={CalendarDays} label="Gasto diário seguro" value={formatMoney(summary.safeDailySpend)} helper="Limite diário para não piorar o mês" tone={summary.safeDailySpend > 0 ? "good" : "danger"} />
          <MetricCard icon={CalendarDays} label="Gasto semanal seguro" value={formatMoney(summary.safeWeeklySpend)} helper="Teto semanal recomendado" tone={summary.safeWeeklySpend > 0 ? "good" : "danger"} />
          <MetricCard icon={ShieldAlert} label="Valor urgente a resolver" value={formatMoney(summary.urgentAmount)} helper={shortfallLabel} tone={summary.urgentAmount > 0 ? "danger" : "good"} />
          <MetricCard icon={CreditCard} label="Cartão mais perigoso" value={summary.topCardRisk ? formatMoney(summary.topCardRisk.amount) : "Sem cartão"} helper={summary.topCardRisk?.label ?? "Nenhum cartão crítico"} tone={summary.topCardRisk && summary.cardIncomeRatio > 0.3 ? "danger" : "neutral"} />
          <MetricCard icon={Rows3} label="Categoria mais pesada" value={summary.topCategory ? formatMoney(summary.topCategory.amount) : formatMoney(0)} helper={summary.topCategory?.label ?? "Sem despesas no mês"} tone="warn" />
          <MetricCard icon={PiggyBank} label="Economia potencial" value={formatMoney(summary.potentialSavings)} helper="Cortes estimados em ajustáveis" tone={summary.potentialSavings > 0 ? "good" : "neutral"} />
          <MetricCard icon={Gauge} label="Score financeiro" value={`${summary.healthScore}/100`} helper={summary.financialStatus} tone={summary.healthScore >= 70 ? "good" : summary.healthScore >= 50 ? "warn" : "danger"} />
          <MetricCard icon={Clock3} label="Dinheiro aguenta" value={`${summary.moneyLastsDays} dias`} helper="Estimativa pelo caixa realizado" tone={summary.moneyLastsDays >= 20 ? "good" : "warn"} />
          <MetricCard icon={TrendingUp} label="Meses futuros comprometidos" value={`${summary.monthsCommittedCount}`} helper="Meses acima do limite prudente" tone={summary.monthsCommittedCount > 0 ? "warn" : "good"} />
          <MetricCard icon={TrendingDown} label="Maior gasto prejudicial" value={summary.mostHarmfulExpense ? formatMoney(summary.mostHarmfulExpense.amount) : formatMoney(0)} helper={summary.mostHarmfulExpense?.label ?? "Sem gasto relevante"} tone={summary.mostHarmfulExpense ? "warn" : "good"} />
          <MetricCard icon={ShieldAlert} label="Maior vazamento" value={summary.biggestLeak ? formatMoney(summary.biggestLeak.amount) : formatMoney(0)} helper={summary.biggestLeak?.label ?? "Sem vazamento ajustável"} tone={summary.biggestLeak ? "danger" : "good"} />
          <MetricCard icon={ListChecks} label="Ação urgente" value={urgentAction} helper="Primeira recomendação operacional" tone={summary.urgentAmount > 0 ? "danger" : "good"} />
        </div>
      </Panel>

      <Panel title="Leitura gerencial dos indicadores">
        <div className="narrative-grid">
          {explanation.whatToDoFirst.slice(0, 4).map((item) => (
            <article className="narrative-card" key={item.title}>
              <strong>{item.title}</strong>
              <span>{item.reason}</span>
              <b>{item.impact}</b>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}
