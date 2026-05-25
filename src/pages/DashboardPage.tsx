import { BadgeCheck, Brain, CircleDollarSign, Clock3, CreditCard, ShieldAlert, TrendingDown, Wallet, WalletCards } from "lucide-react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { chartOptions, doughnutOptions } from "../components/charts/chartConfig";
import { IconBadge, MetricCard, Panel, RiskPill } from "../components/ui/FinanceUI";
import { buildDiagnostics, categoryTotals } from "../lib/financeEngine";
import { formatMoney, formatPercent } from "../lib/formatters";
import type { WorkspacePageProps } from "../app/routes";

function scoreTone(score: number) {
  if (score >= 70) return "good";
  if (score >= 50) return "warn";
  return "danger";
}

function HealthScore({ props }: { props: WorkspacePageProps }) {
  const { summary } = props;
  const scoreStyle = { "--score": `${summary.healthScore * 3.6}deg` } as React.CSSProperties;

  return (
    <Panel title="Saúde Financeira" className="score-panel">
      <div className="score-layout">
        <div className={`score-ring ${scoreTone(summary.healthScore)}`} style={scoreStyle}>
          <div>
            <strong>{summary.healthScore}</strong>
            <span>/100</span>
          </div>
        </div>
        <div className="score-copy">
          <RiskPill level={summary.riskLevel} />
          <h3>{summary.financialStatus}</h3>
          <p>Análise do mês selecionado. Os gráficos abaixo mostram projeção futura; os cards acima não acumulam outros meses.</p>
          <div className="rule-row">
            <span>{summary.adaptiveBudget.label}</span>
            <strong>
              {Math.round(summary.adaptiveBudget.needs * 100)}/
              {Math.round(summary.adaptiveBudget.wants * 100)}/
              {Math.round(summary.adaptiveBudget.reserveOrDebt * 100)}
            </strong>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function CardsModule({ props }: { props: WorkspacePageProps }) {
  return (
    <Panel title="Módulo de Cartões" action={<RiskPill level={props.summary.cardIncomeRatio > 0.3 ? "risk" : "healthy"} label="Risco consolidado" />}>
      <div className="card-list">
        {props.workspace.cards.map((card) => {
          const usage = card.limit > 0 ? card.currentInvoice / card.limit : 0;
          return (
            <article className="credit-row" key={card.id}>
              <div className="credit-main">
                <IconBadge icon={CreditCard} tone={usage > 0.4 ? "danger" : "neutral"} />
                <div>
                  <strong>{card.bank}</strong>
                  <span>{card.name}</span>
                </div>
              </div>
              <div className="credit-metric">
                <span>Fatura</span>
                <strong>{formatMoney(card.currentInvoice)}</strong>
              </div>
              <div className="credit-progress">
                <span>{formatPercent(usage)} do limite</span>
                <div><i style={{ width: `${Math.min(usage * 100, 100)}%` }} /></div>
              </div>
              <div className="credit-metric">
                <span>Vencimento</span>
                <strong>Dia {card.dueDay}</strong>
              </div>
            </article>
          );
        })}
      </div>
    </Panel>
  );
}

export function DashboardPage(props: WorkspacePageProps) {
  const { summary, workspace } = props;
  const diagnostics = buildDiagnostics(summary, workspace.cards, workspace.debts);
  const categoryData = categoryTotals(workspace.transactions);
  const cashflowData = {
    labels: summary.futureCommitments.map((item) => item.month),
    datasets: [
      {
        label: "Saldo projetado",
        data: summary.futureCommitments.map((item) => item.projectedBalance),
        borderColor: "#0f766e",
        backgroundColor: "rgba(15, 118, 110, 0.12)",
        fill: true,
        tension: 0.35,
      },
      {
        label: "Compromissos",
        data: summary.futureCommitments.map((item) => item.total),
        borderColor: "#b45309",
        backgroundColor: "rgba(180, 83, 9, 0.08)",
        fill: true,
        tension: 0.35,
      },
    ],
  };
  const categoryChart = {
    labels: categoryData.map((item) => item.category),
    datasets: [
      {
        data: categoryData.map((item) => item.amount),
        backgroundColor: ["#0f766e", "#2563eb", "#b45309", "#dc2626", "#64748b", "#16a34a"],
        borderWidth: 0,
      },
    ],
  };
  const installmentChart = {
    labels: summary.futureCommitments.map((item) => item.month),
    datasets: [
      { label: "Cartão", data: summary.futureCommitments.map((item) => item.cardInstallments), backgroundColor: "#0f766e", borderRadius: 6 },
      { label: "Empréstimos", data: summary.futureCommitments.map((item) => item.loanInstallments), backgroundColor: "#2563eb", borderRadius: 6 },
      { label: "Dívidas", data: summary.futureCommitments.map((item) => item.debts), backgroundColor: "#b45309", borderRadius: 6 },
    ],
  };

  return (
    <div className="screen-stack">
      <div className="kpi-grid">
        <MetricCard icon={CircleDollarSign} label="Renda do Mês" value={formatMoney(summary.expectedIncome)} helper={`Recebido ${formatMoney(summary.confirmedIncome)} | a receber ${formatMoney(summary.pendingIncome)}`} tone="good" />
        <MetricCard icon={Wallet} label="Caixa Realizado no Mês" value={formatMoney(summary.realizedBalance)} helper="Recebido menos valores já pagos" tone={summary.realizedBalance >= 0 ? "good" : "danger"} />
        <MetricCard icon={Clock3} label="Em Aberto no Mês" value={formatMoney(summary.monthlyOpenObligations)} helper={summary.cashShortfall > 0 ? `Sem cobertura: ${formatMoney(summary.cashShortfall)}` : "Pendências cobertas pela renda do mês"} tone={summary.cashShortfall > 0 ? "danger" : "warn"} />
        <MetricCard icon={TrendingDown} label="Comprometimento do Mês" value={formatPercent(summary.committedIncomeRatio)} helper="Despesas, faturas e dívidas da competência" tone={summary.committedIncomeRatio > 0.7 ? "danger" : "warn"} />
        <MetricCard icon={WalletCards} label="Faturas do Mês" value={formatMoney(summary.cardInvoices)} helper={`Em aberto ${formatMoney(summary.openCardInvoices)} | pagas ${formatMoney(summary.paidCardInvoices)}`} tone={summary.cardIncomeRatio > 0.3 ? "danger" : "neutral"} />
        <MetricCard icon={BadgeCheck} label="Saldo Previsto do Mês" value={formatMoney(summary.projectedBalance)} helper="Renda do mês menos compromissos do mês" tone={summary.projectedBalance >= 0 ? "good" : "danger"} />
      </div>

      <div className="dashboard-grid">
        <HealthScore props={props} />
        <Panel title="Projeção de Fluxo" className="chart-panel">
          <Line data={cashflowData} options={chartOptions} />
        </Panel>
      </div>

      <div className="three-grid">
        <Panel title="Categorias Pesadas" className="chart-panel">
          <Doughnut data={categoryChart} options={doughnutOptions} />
        </Panel>
        <Panel title="Parcelas Futuras" className="chart-panel">
          <Bar data={installmentChart} options={chartOptions} />
        </Panel>
        <Panel title="Diagnóstico Executivo">
          <div className="insight-list">
            {diagnostics.slice(0, 3).map((item) => (
              <article className="insight-row" key={item.id}>
                <IconBadge icon={ShieldAlert} tone={item.severity === "critical" ? "danger" : "warn"} />
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
            {diagnostics.length === 0 && (
              <article className="insight-row">
                <IconBadge icon={Brain} tone="good" />
                <div>
                  <strong>Nenhum alerta técnico relevante</strong>
                  <p>Continue alimentando a base para manter o diagnóstico confiável.</p>
                </div>
              </article>
            )}
          </div>
        </Panel>
      </div>

      <div className="dashboard-grid lower">
        <CardsModule props={props} />
        <Panel title="Plano de Ação">
          <div className="action-list">
            {workspace.actions.slice(0, 5).map((action) => (
              <article className="action-row" key={action.id}>
                <div>
                  <strong>{action.title}</strong>
                  <span>{action.reason}</span>
                </div>
                <div className="action-meta">
                  <RiskPill level={action.priority} label={action.horizon} />
                  <strong>{formatMoney(action.expectedSavings)}</strong>
                </div>
              </article>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
