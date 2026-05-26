import {
  BadgeCheck,
  Brain,
  CalendarDays,
  CircleDollarSign,
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
  WalletCards,
} from "lucide-react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { chartOptions, doughnutOptions } from "../components/charts/chartConfig";
import { ScoreExplanationCard } from "../components/finance/ScoreExplanationCard";
import { IconBadge, MetricCard, Panel, RiskPill } from "../components/ui/FinanceUI";
import { buildAlerts, buildDiagnostics, categoryTotals } from "../lib/financeEngine";
import { buildFinancialExplanation } from "../lib/financialExplainer";
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

function ExecutiveNarrative({ props }: { props: WorkspacePageProps }) {
  const diagnostics = buildDiagnostics(props.summary, props.workspace.cards, props.workspace.debts);
  const alerts = buildAlerts(props.summary, props.workspace.cards);
  const directExpenses = props.summary.directFixedExpenses + props.summary.directVariableExpenses;
  const explanation = buildFinancialExplanation({
    summary: props.summary,
    cards: props.workspace.cards,
    debts: props.workspace.debts,
    diagnostics,
    actions: props.workspace.actions,
    alerts,
  });

  return (
    <Panel title="Leitura simples do mês" className="narrative-panel">
      <div className="narrative-lead">
        <IconBadge icon={Brain} tone={props.summary.projectedBalance < 0 ? "danger" : "good"} />
        <p>{explanation.simpleMonthSummary}</p>
      </div>
      <div className="balance-ledger">
        <span>Renda prevista <strong>{formatMoney(props.summary.expectedIncome)}</strong></span>
        <span>Despesas diretas <strong>-{formatMoney(directExpenses)}</strong></span>
        <span>Faturas do mês <strong>-{formatMoney(props.summary.cardInvoices)}</strong></span>
        <span>Dívidas e empréstimos <strong>-{formatMoney(props.summary.debtPayments)}</strong></span>
        <span className={props.summary.projectedBalance < 0 ? "negative" : "positive"}>
          Saldo previsto <strong>{formatMoney(props.summary.projectedBalance)}</strong>
        </span>
      </div>
      <div className="narrative-grid compact">
        {explanation.whatToDoFirst.slice(0, 3).map((action) => (
          <article className="narrative-card" key={action.title}>
            <IconBadge icon={ListChecks} tone="neutral" />
            <div>
              <strong>{action.title}</strong>
              <span>{action.impact}</span>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

export function DashboardPage(props: WorkspacePageProps) {
  const { competence, summary, workspace } = props;
  const diagnostics = buildDiagnostics(summary, workspace.cards, workspace.debts);
  const alerts = buildAlerts(summary, workspace.cards);
  const dashboardExplanation = buildFinancialExplanation({
    summary,
    cards: workspace.cards,
    debts: workspace.debts,
    diagnostics,
    actions: workspace.actions,
    alerts,
  });
  const categoryData = categoryTotals(workspace.transactions, competence);
  const currentProjection = summary.futureCommitments[0];
  const monthInstallments = (currentProjection?.nonInvoicedCardInstallments ?? 0) + (currentProjection?.loanInstallments ?? 0);
  const shortfallLabel = summary.projectedBalance < 0
    ? `Faltam ${formatMoney(Math.abs(summary.projectedBalance))}`
    : "Mês fecha positivo";
  const urgentAction = dashboardExplanation.whatToDoFirst[0]?.title ?? "Manter revisão semanal";
  const commitmentValue = summary.expectedIncome > 0
    ? formatPercent(summary.committedIncomeRatio)
    : summary.totalOutflow > 0 ? "Sem renda" : "0%";
  const commitmentHelper = summary.expectedIncome > 0
    ? "Despesas, faturas e dívidas da competência"
    : `Compromissos de ${formatMoney(summary.totalOutflow)} sem renda no mês`;
  const hasNegativeProjectedMonth = summary.futureCommitments.some((item) => item.projectedBalance < 0);
  const cashflowData = {
    labels: summary.futureCommitments.map((item) => item.month),
    datasets: [
      {
        label: "Receita prevista",
        data: summary.futureCommitments.map((item) => item.expectedIncome),
        borderColor: "#16a34a",
        backgroundColor: "rgba(22, 163, 74, 0.08)",
        fill: false,
        tension: 0.35,
      },
      {
        label: "Compromissos totais",
        data: summary.futureCommitments.map((item) => item.total),
        borderColor: "#b45309",
        backgroundColor: "rgba(180, 83, 9, 0.08)",
        fill: false,
        tension: 0.35,
      },
      {
        label: "Faturas/cartões",
        data: summary.futureCommitments.map((item) => item.cardInvoices),
        borderColor: "#dc2626",
        backgroundColor: "rgba(220, 38, 38, 0.08)",
        fill: false,
        tension: 0.35,
      },
      {
        label: "Saldo livre projetado",
        data: summary.futureCommitments.map((item) => item.projectedBalance),
        borderColor: "#0f766e",
        backgroundColor: "rgba(15, 118, 110, 0.12)",
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
      { label: "Faturas/cartões", data: summary.futureCommitments.map((item) => item.cardInvoices), backgroundColor: "#0f766e", borderRadius: 6 },
      { label: "Empréstimos", data: summary.futureCommitments.map((item) => item.loanInstallments), backgroundColor: "#2563eb", borderRadius: 6 },
      { label: "Dívidas", data: summary.futureCommitments.map((item) => item.debts), backgroundColor: "#b45309", borderRadius: 6 },
    ],
  };

  return (
    <div className="screen-stack">
      <div className="kpi-grid dashboard-kpi-grid">
        <MetricCard icon={CircleDollarSign} label="Renda Recebida no Mês" value={formatMoney(summary.confirmedIncome)} helper="Dinheiro que já entrou no caixa da competência" tone="good" />
        <MetricCard icon={Clock3} label="Receitas a Receber" value={formatMoney(summary.pendingIncome)} helper={summary.pendingIncome > 0 ? "Ainda depende de confirmação ou pagamento" : "Nada pendente para entrar nesta competência"} tone={summary.pendingIncome > 0 ? "warn" : "good"} />
        <MetricCard icon={ReceiptText} label="Compromissos Totais do Mês" value={formatMoney(summary.totalOutflow)} helper={`Comprometimento: ${commitmentValue}. ${commitmentHelper}`} tone={summary.committedIncomeRatio > 0.7 || summary.expectedIncome <= 0 && summary.totalOutflow > 0 ? "danger" : "warn"} />
        <MetricCard icon={TrendingDown} label="Comprometimento do Mês" value={commitmentValue} helper={commitmentHelper} tone={summary.committedIncomeRatio > 0.7 || summary.expectedIncome <= 0 && summary.totalOutflow > 0 ? "danger" : "warn"} />
        <MetricCard icon={WalletCards} label="Faturas do Mês" value={formatMoney(summary.cardInvoices)} helper={`Abertas ${formatMoney(summary.openCardInvoices)} | pagas ${formatMoney(summary.paidCardInvoices)}`} tone={summary.cardIncomeRatio > 0.3 ? "danger" : "neutral"} />
        <MetricCard icon={Rows3} label="Parcelas do Mês" value={formatMoney(monthInstallments)} helper="Parcelas não incluídas em faturas e empréstimos do mês" tone={monthInstallments > 0 ? "warn" : "good"} />
        <MetricCard icon={BadgeCheck} label="Saldo Previsto do Mês" value={formatMoney(summary.projectedBalance)} helper={`Renda ${formatMoney(summary.expectedIncome)} - compromissos ${formatMoney(summary.totalOutflow)}`} tone={summary.projectedBalance >= 0 ? "good" : "danger"} />
      </div>

      <ExecutiveNarrative props={props} />

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

      <div className="dashboard-grid">
        <HealthScore props={props} />
        <Panel title="Projeção de Fluxo por Competência" className="chart-panel flow-panel">
          <Line data={cashflowData} options={chartOptions} />
          {hasNegativeProjectedMonth && (
            <p className="chart-note danger">
              Há competência com saldo livre negativo. A linha verde mostra o que sobra depois de renda prevista, despesas diretas, faturas, parcelas, dívidas e empréstimos.
            </p>
          )}
        </Panel>
      </div>

      <div className="three-grid">
        <Panel title="Categorias Pesadas" className="chart-panel">
          <Doughnut data={categoryChart} options={doughnutOptions} />
        </Panel>
        <Panel title="Compromissos por Competência" className="chart-panel">
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
        <ScoreExplanationCard summary={summary} />
      </div>

      <div className="dashboard-grid lower">
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
