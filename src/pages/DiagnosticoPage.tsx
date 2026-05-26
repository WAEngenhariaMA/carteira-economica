import { useState } from "react";
import { AlertTriangle, BookOpen, Brain, ListChecks, Sparkles } from "lucide-react";
import { IconBadge, Panel, RiskPill } from "../components/ui/FinanceUI";
import { buildAlerts, buildDiagnostics, buildRuleBasedActions } from "../lib/financeEngine";
import { buildFinancialExplanation } from "../lib/financialExplainer";
import { formatMoney, formatPercent } from "../lib/formatters";
import { buildAggregatedDiagnosticInput, diagnosticAiService } from "../services/diagnosticAiService";
import type { WorkspacePageProps } from "../app/routes";
import type { ProviderGenerationResult } from "../lib/diagnostic/types";

function BudgetBar({ label, ratio, amount }: { label: string; ratio: number; amount: number }) {
  return (
    <div className="budget-row">
      <div>
        <strong>{label}</strong>
        <span>{formatMoney(amount)}</span>
      </div>
      <div className="budget-track">
        <i style={{ width: `${ratio * 100}%` }} />
      </div>
      <b>{Math.round(ratio * 100)}%</b>
    </div>
  );
}

function formatFindingDeviation(metric: string, deviation: number) {
  const normalized = metric.toLowerCase();
  if (normalized.includes("comprometimento") || normalized.includes("cart") || normalized.includes("receb")) {
    return formatPercent(deviation);
  }

  return formatMoney(deviation);
}

export function DiagnosticoPage({ userId, competence, workspace, summary }: WorkspacePageProps) {
  const [intelligentDiagnosis, setIntelligentDiagnosis] = useState<ProviderGenerationResult | null>(null);
  const [generatingDiagnosis, setGeneratingDiagnosis] = useState(false);
  const diagnostics = buildDiagnostics(summary, workspace.cards, workspace.debts);
  const alerts = buildAlerts(summary, workspace.cards);
  const suggestedActions = buildRuleBasedActions(summary);
  const explanation = buildFinancialExplanation({
    summary,
    cards: workspace.cards,
    debts: workspace.debts,
    diagnostics,
    actions: suggestedActions,
    alerts,
  });
  const displayedDiagnosis = intelligentDiagnosis?.diagnosis;

  async function handleGenerateDiagnosis() {
    setGeneratingDiagnosis(true);
    try {
      const input = buildAggregatedDiagnosticInput({
        competence,
        summary,
        findings: diagnostics,
        actions: suggestedActions,
        scoreDroppedReasons: explanation.scoreDroppedReasons,
        scoreImprovementSuggestions: explanation.scoreImprovementSuggestions,
      });
      const result = await diagnosticAiService.generate(input, userId);
      setIntelligentDiagnosis(result);
    } finally {
      setGeneratingDiagnosis(false);
    }
  }

  return (
    <div className="screen-stack">
      <Panel
        title="Diagnóstico Inteligente"
        action={(
          <button className="primary-button" type="button" onClick={handleGenerateDiagnosis} disabled={generatingDiagnosis}>
            <Sparkles size={16} />
            {generatingDiagnosis ? "Gerando..." : "Gerar diagnóstico com IA"}
          </button>
        )}
      >
        <div className="narrative-stack">
          <div className="narrative-lead">
            <IconBadge icon={Brain} tone={summary.projectedBalance < 0 ? "danger" : "good"} />
            <p>{displayedDiagnosis?.simpleExplanation ?? explanation.simpleMonthSummary}</p>
          </div>
          <div className="ai-provider-strip">
            <RiskPill
              level={intelligentDiagnosis?.fallbackUsed ? "attention" : "healthy"}
              label={intelligentDiagnosis ? `Provider usado: ${intelligentDiagnosis.providerLabel}` : "Provider usado: Regras puras"}
            />
            <span>
              {intelligentDiagnosis
                ? `Fallback: ${intelligentDiagnosis.fallbackUsed ? "Sim" : "Não"} | ${intelligentDiagnosis.latencyMs} ms`
                : "Clique para tentar IA local/nuvem. Se falhar, as regras continuam funcionando."}
            </span>
          </div>
          {displayedDiagnosis && (
            <div className="narrative-grid">
              <article className="narrative-card">
                <strong>Causa raiz</strong>
                <span>{displayedDiagnosis.rootCause}</span>
              </article>
              <article className="narrative-card">
                <strong>Conclusão</strong>
                <span>{displayedDiagnosis.plainLanguageConclusion}</span>
              </article>
            </div>
          )}
        </div>
      </Panel>

      <div className="dashboard-grid">
        <Panel title="Regra Adaptativa">
          <div className="budget-bars">
            <BudgetBar label="Necessidades" ratio={summary.adaptiveBudget.needs} amount={summary.income * summary.adaptiveBudget.needs} />
            <BudgetBar label="Desejos" ratio={summary.adaptiveBudget.wants} amount={summary.income * summary.adaptiveBudget.wants} />
            <BudgetBar label="Reserva ou dívida" ratio={summary.adaptiveBudget.reserveOrDebt} amount={summary.income * summary.adaptiveBudget.reserveOrDebt} />
          </div>
        </Panel>
        <Panel title="Leitura Executiva">
          <div className="score-copy">
            <RiskPill level={summary.riskLevel} />
            <h3>{summary.financialStatus}</h3>
            <p>{displayedDiagnosis?.executiveSummary ?? explanation.executiveDiagnosis}</p>
            <p>{summary.adaptiveBudget.explanation}</p>
            <div className="rule-row">
              <span>A receber</span>
              <strong>{formatPercent(summary.pendingIncomeRatio)}</strong>
            </div>
            <div className="rule-row">
              <span>Pendências sobre saídas</span>
              <strong>{formatPercent(summary.pendingExpenseRatio)}</strong>
            </div>
            <div className="rule-row">
              <span>Próximos 5 meses</span>
              <strong>{formatMoney(summary.futureCommitmentsTotal)}</strong>
            </div>
          </div>
        </Panel>
      </div>
      <Panel title="Explicação em Português Claro">
        <div className="narrative-stack">
          <div className="narrative-lead">
            <IconBadge icon={Brain} tone={summary.projectedBalance < 0 ? "danger" : "good"} />
            <p>{explanation.simpleMonthSummary}</p>
          </div>
          <div className="narrative-grid">
            <article className="narrative-card">
              <strong>Nota financeira</strong>
              <span>{explanation.scoreExplanation}</span>
            </article>
            <article className="narrative-card">
              <strong>Comprometimento</strong>
              <span>{explanation.commitmentExplanation}</span>
            </article>
            <article className="narrative-card">
              <strong>Saldo do mês</strong>
              <span>{explanation.balanceExplanation}</span>
            </article>
            <article className="narrative-card">
              <strong>Cartões</strong>
              <span>{explanation.cardsExplanation}</span>
            </article>
            <article className="narrative-card">
              <strong>Parcelas futuras</strong>
              <span>{explanation.installmentsExplanation}</span>
            </article>
          </div>
        </div>
      </Panel>
      <div className="dashboard-grid">
        <Panel title="O Que Fazer Primeiro">
          <div className="action-list">
            {explanation.whatToDoFirst.map((action) => (
              <article className="action-row" key={action.title}>
                <div>
                  <strong>{action.title}</strong>
                  <span>{action.reason}</span>
                </div>
                <div className="action-meta">
                  <RiskPill level="attention" label="Prioridade" />
                  <strong>{action.impact}</strong>
                </div>
              </article>
            ))}
          </div>
        </Panel>
        <Panel title="Plano 7, 30 e 90 Dias">
          <div className="narrative-grid one-column">
            {explanation.horizonPlan.map((item) => (
              <article className="narrative-card horizon-card" key={item.horizon}>
                <IconBadge icon={ListChecks} tone={item.horizon === "7 dias" ? "danger" : "neutral"} />
                <div>
                  <strong>{item.horizon}: {item.title}</strong>
                  <span>{item.description}</span>
                  <b>Impacto esperado: {formatMoney(item.expectedImpact)}</b>
                </div>
              </article>
            ))}
          </div>
        </Panel>
      </div>
      <Panel title="Achados Técnicos">
        <div className="diagnostic-grid">
          {diagnostics.map((item) => (
            <article className="diagnostic-card" key={item.id}>
              <div>
                <IconBadge icon={AlertTriangle} tone={item.severity === "critical" ? "danger" : "warn"} />
                <RiskPill level={item.severity} />
              </div>
              <h3>{item.title}</h3>
              <p><strong>O que significa:</strong> {item.meaning}</p>
              <p><strong>Por que é perigoso:</strong> {item.risk}</p>
              <p><strong>O que fazer agora:</strong> {item.recommendedAction}</p>
              <span>{item.metric} | Desvio {formatFindingDeviation(item.metric, item.deviation)}</span>
            </article>
          ))}
        </div>
      </Panel>
      <Panel title="Diagnóstico Técnico Detalhado">
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Indicador</th>
                <th>Valor</th>
                <th>Interpretação</th>
              </tr>
            </thead>
            <tbody>
              {explanation.technicalDiagnosis.map((item) => (
                <tr key={item.label}>
                  <td><strong>{item.label}</strong></td>
                  <td>{item.value}</td>
                  <td>{item.interpretation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Termos Financeiros Explicados">
        <div className="narrative-grid">
          {explanation.glossary.map((item) => (
            <article className="narrative-card" key={item.term}>
              <IconBadge icon={BookOpen} tone="neutral" />
              <div>
                <strong>{item.term}</strong>
                <span>{item.explanation}</span>
              </div>
            </article>
          ))}
        </div>
      </Panel>
      <Panel title="Plano Gerencial Sugerido">
        <div className="action-list">
          {suggestedActions.map((action) => (
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
  );
}
