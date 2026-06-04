import {
  BadgeCheck,
  Brain,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Hourglass,
  ListChecks,
  ReceiptText,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  chartOptions,
  doughnutOptions,
} from "../components/charts/chartConfig";
import { ScoreExplanationCard } from "../components/finance/ScoreExplanationCard";
import {
  IconBadge,
  MetricCard,
  Panel,
  RiskPill,
} from "../components/ui/FinanceUI";
import {
  buildAlerts,
  buildDiagnostics,
  categoryTotals,
} from "../lib/financeEngine";
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
  const scoreStyle = {
    "--score": `${summary.healthScore * 3.6}deg`,
  } as React.CSSProperties;

  return (
    <Panel title="Saúde Financeira" className="score-panel">
      <div className="score-layout">
        <div
          className={`score-ring ${scoreTone(summary.healthScore)}`}
          style={scoreStyle}
        >
          <div>
            <strong>{summary.healthScore}</strong>
            <span>/100</span>
          </div>
        </div>
        <div className="score-copy">
          <RiskPill level={summary.riskLevel} />
          <h3>{summary.financialStatus}</h3>
          <p>
            Análise do mês selecionado. Os gráficos abaixo mostram projeção
            futura; os cards executivos acima ficam restritos à competência.
          </p>
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
    <Panel
      title="Módulo de Cartões"
      action={
        <RiskPill
          level={props.summary.cardIncomeRatio > 0.3 ? "risk" : "healthy"}
          label="Risco consolidado"
        />
      }
    >
      <div className="card-list">
        {props.workspace.cards.map((card) => {
          const usage = card.limit > 0 ? card.currentInvoice / card.limit : 0;
          return (
            <article className="credit-row" key={card.id}>
              <div className="credit-main">
                <IconBadge
                  icon={CreditCard}
                  tone={usage > 0.4 ? "danger" : "neutral"}
                />
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
                <div>
                  <i style={{ width: `${Math.min(usage * 100, 100)}%` }} />
                </div>
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

type CompositionItem = {
  id: string;
  label: string;
  amount: number;
  detail: string;
  tone: "teal" | "red" | "blue" | "amber";
  icon: LucideIcon;
};

function MonthComposition({ props }: { props: WorkspacePageProps }) {
  const { summary } = props;
  const items = [
    {
      id: "direct",
      label: "Despesas diretas",
      amount: summary.directFixedExpenses + summary.directVariableExpenses,
      detail: "Saídas fora do cartão na competência.",
      tone: "teal",
      icon: ReceiptText,
    },
    {
      id: "cards",
      label: "Faturas de cartão",
      amount: summary.cardInvoices,
      detail: `Abertas ${formatMoney(summary.openCardInvoices)} | pagas ${formatMoney(summary.paidCardInvoices)}`,
      tone: "red",
      icon: CreditCard,
    },
    {
      id: "loans",
      label: "Empréstimos parcelados",
      amount: summary.loanInstallments,
      detail: `Pagos ${formatMoney(summary.paidLoanInstallments)} | em aberto/agendados ${formatMoney(summary.pendingLoanInstallments)}`,
      tone: "blue",
      icon: ListChecks,
    },
    {
      id: "debts",
      label: "Dívidas fixas",
      amount: summary.debtMonthlyPayments,
      detail: "Compromissos recorrentes fora do cartão.",
      tone: "amber",
      icon: ShieldAlert,
    },
  ] satisfies CompositionItem[];
  const visibleItems = items.filter((item) => item.amount > 0);
  const totalCommitted = Math.max(summary.totalOutflow, 0);

  return (
    <section className="composition-block" aria-label="Mapa de compromissos">
      <div className="composition-summary">
        <div>
          <span className="composition-eyebrow">Mapa dos compromissos</span>
          <strong>{formatMoney(summary.totalOutflow)}</strong>
        </div>
        <p>
          Visão bancária das saídas do mês, separando despesas diretas,
          faturas, empréstimos parcelados e dívidas fixas.
        </p>
      </div>

      <div className="composition-rail" aria-label="Composição dos compromissos">
        {visibleItems.map((item) => (
          <span
            key={item.id}
            className={`composition-segment segment-${item.tone}`}
            style={{
              width: `${totalCommitted > 0 ? (item.amount / totalCommitted) * 100 : 0}%`,
            }}
            title={`${item.label}: ${formatMoney(item.amount)}`}
          />
        ))}
      </div>

      <div className="composition-list">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <article className="composition-item" key={item.id}>
              <div className="composition-item-top">
                <div className="composition-title">
                  <span className={`composition-dot dot-${item.tone}`} />
                  <Icon size={16} />
                  <strong>{item.label}</strong>
                </div>
                <b>{formatMoney(item.amount)}</b>
              </div>
              <div className="composition-item-meta">
                <span>
                  {totalCommitted > 0
                    ? formatPercent(item.amount / totalCommitted)
                    : "0%"}{" "}
                  do total
                </span>
                <span>{item.detail}</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ExecutiveNarrative({ props }: { props: WorkspacePageProps }) {
  const diagnostics = buildDiagnostics(
    props.summary,
    props.workspace.cards,
    props.workspace.debts,
  );
  const alerts = buildAlerts(props.summary, props.workspace.cards);
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
        <IconBadge
          icon={Brain}
          tone={props.summary.projectedBalance < 0 ? "danger" : "good"}
        />
        <p>{explanation.simpleMonthSummary}</p>
      </div>
      <div className="narrative-summary-grid">
        <article className="summary-chip">
          <span>Renda prevista</span>
          <strong>{formatMoney(props.summary.expectedIncome)}</strong>
        </article>
        <article className="summary-chip">
          <span>Pressão da renda</span>
          <strong>{formatPercent(props.summary.committedIncomeRatio)}</strong>
        </article>
        <article
          className={
            props.summary.projectedBalance < 0
              ? "summary-chip negative"
              : "summary-chip positive"
          }
        >
          <span>Saldo previsto</span>
          <strong>{formatMoney(props.summary.projectedBalance)}</strong>
        </article>
      </div>
      <MonthComposition props={props} />
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
  const diagnostics = buildDiagnostics(
    summary,
    workspace.cards,
    workspace.debts,
  );
  const categoryData = categoryTotals(workspace.transactions, competence);
  const directExpenses =
    summary.directFixedExpenses + summary.directVariableExpenses;
  const totalPaid =
    summary.paidDirectExpenses +
    summary.paidCardInvoices +
    summary.paidLoanInstallments;
  const commitmentValue =
    summary.expectedIncome > 0
      ? formatPercent(summary.committedIncomeRatio)
      : summary.totalOutflow > 0
        ? "Sem renda"
        : "0%";
  const hasNegativeProjectedMonth = summary.futureCommitments.some(
    (item) => item.projectedBalance < 0,
  );
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
        backgroundColor: [
          "#0f766e",
          "#2563eb",
          "#b45309",
          "#dc2626",
          "#64748b",
          "#16a34a",
        ],
        borderWidth: 0,
      },
    ],
  };
  const commitmentBreakdownChart = {
    labels: summary.futureCommitments.map((item) => item.month),
    datasets: [
      {
        label: "Faturas/cartões",
        data: summary.futureCommitments.map((item) => item.cardInvoices),
        backgroundColor: "#dc2626",
        borderRadius: 6,
      },
      {
        label: "Empréstimos",
        data: summary.futureCommitments.map((item) => item.loanInstallments),
        backgroundColor: "#2563eb",
        borderRadius: 6,
      },
      {
        label: "Dívidas",
        data: summary.futureCommitments.map((item) => item.debts),
        backgroundColor: "#b45309",
        borderRadius: 6,
      },
    ],
  };

  return (
    <div className="screen-stack">
      <div className="kpi-grid dashboard-kpi-grid">
        <MetricCard
          icon={CircleDollarSign}
          label="Renda Recebida no Mês"
          value={formatMoney(summary.confirmedIncome)}
          helper="Dinheiro que já entrou no caixa da competência"
          tone="good"
        />
        <MetricCard
          icon={Clock3}
          label="Receitas a Receber"
          value={formatMoney(summary.pendingIncome)}
          helper={
            summary.pendingIncome > 0
              ? "Ainda depende de confirmação ou pagamento"
              : "Nada pendente para entrar nesta competência"
          }
          tone={summary.pendingIncome > 0 ? "warn" : "good"}
        />
        <MetricCard
          icon={ReceiptText}
          label="Despesas Totais do Mês"
          value={formatMoney(summary.totalOutflow)}
          helper={`Diretas ${formatMoney(directExpenses)} + faturas ${formatMoney(summary.cardInvoices)} + empréstimos/dívidas ${formatMoney(summary.debtPayments)} | pressão ${commitmentValue}`}
          tone={
            summary.committedIncomeRatio > 0.7 ||
            (summary.expectedIncome <= 0 && summary.totalOutflow > 0)
              ? "danger"
              : "warn"
          }
        />
        <MetricCard
          icon={BadgeCheck}
          label="Saldo Previsto"
          value={formatMoney(summary.projectedBalance)}
          helper={
            summary.projectedBalance >= 0
              ? `Sobra projetada de ${formatMoney(summary.projectedBalance)} após todos os compromissos`
              : `Faltam ${formatMoney(Math.abs(summary.projectedBalance))} para fechar o mês sem pressão`
          }
          tone={summary.projectedBalance >= 0 ? "good" : "danger"}
        />
        <MetricCard
          icon={CheckCircle2}
          label="Total Pago no Mês"
          value={formatMoney(totalPaid)}
          helper={`Diretas ${formatMoney(summary.paidDirectExpenses)} + faturas ${formatMoney(summary.paidCardInvoices)} + parcelas ${formatMoney(summary.paidLoanInstallments)}`}
          tone={totalPaid > 0 ? "good" : "neutral"}
        />
        <MetricCard
          icon={Hourglass}
          label="Falta Pagar"
          value={formatMoney(summary.monthlyOpenObligations)}
          helper={
            summary.monthlyOpenObligations > 0
              ? `Pendente: despesas ${formatMoney(summary.pendingDirectExpenses)} + faturas abertas ${formatMoney(summary.openCardInvoices)} + dívidas ${formatMoney(summary.debtMonthlyPayments)}`
              : "Todos os compromissos do mês foram quitados"
          }
          tone={summary.monthlyOpenObligations > 0 ? "warn" : "good"}
        />
      </div>

      <ExecutiveNarrative props={props} />

      <div className="dashboard-grid">
        <HealthScore props={props} />
        <Panel
          title="Projeção de Fluxo por Competência"
          className="chart-panel flow-panel"
        >
          <Line data={cashflowData} options={chartOptions} />
          {hasNegativeProjectedMonth && (
            <p className="chart-note danger">
              Há competência com saldo livre negativo. A linha verde mostra o
              que sobra depois de renda prevista, despesas diretas, faturas,
              parcelas, dívidas e empréstimos.
            </p>
          )}
        </Panel>
      </div>

      <div className="three-grid">
        <Panel title="Categorias Pesadas" className="chart-panel">
          <Doughnut data={categoryChart} options={doughnutOptions} />
        </Panel>
        <Panel
          title="Estratificação de Faturas, Empréstimos e Dívidas"
          className="chart-panel"
        >
          <Bar data={commitmentBreakdownChart} options={chartOptions} />
        </Panel>
        <Panel title="Diagnóstico Executivo">
          <div className="insight-list">
            {diagnostics.slice(0, 3).map((item) => (
              <article className="insight-row" key={item.id}>
                <IconBadge
                  icon={ShieldAlert}
                  tone={item.severity === "critical" ? "danger" : "warn"}
                />
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
                  <p>
                    Continue alimentando a base para manter o diagnóstico
                    confiável.
                  </p>
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
