import { Gauge, TrendingUp } from "lucide-react";
import { formatMoney, formatPercent } from "../../lib/formatters";
import type { FinancialSummary, ScoreFactor } from "../../types/finance";
import { IconBadge, Panel } from "../ui/FinanceUI";

function factorValue(factor: ScoreFactor) {
  if (Math.abs(factor.currentValue) <= 1.5 && Math.abs(factor.recommendedValue) <= 1.5) {
    return `${formatPercent(factor.currentValue)} / meta ${formatPercent(factor.recommendedValue)}`;
  }

  return `${formatMoney(factor.currentValue)} / meta ${formatMoney(factor.recommendedValue)}`;
}

export function ScoreExplanationCard({ summary }: { summary: FinancialSummary }) {
  return (
    <Panel title="Por que sua nota está assim" className="score-explanation-panel">
      <div className="score-explanation-head">
        <IconBadge icon={Gauge} tone={summary.healthScore >= 70 ? "good" : summary.healthScore >= 50 ? "warn" : "danger"} />
        <div>
          <strong>{summary.healthScore}/100</strong>
          <span>{summary.dataReliabilityLabel} | Qualidade dos dados {summary.dataQualityScore}/100</span>
        </div>
      </div>

      <div className="score-factor-list">
        {summary.scoreFactors.length === 0 && (
          <article className="score-factor-row positive">
            <IconBadge icon={TrendingUp} tone="good" />
            <div>
              <strong>Nenhuma penalidade crítica encontrada</strong>
              <span>O motor de regras não identificou fatores relevantes derrubando a pontuação.</span>
            </div>
          </article>
        )}

        {summary.scoreFactors.map((factor) => (
          <article className="score-factor-row" key={factor.id}>
            <span className="score-points">{factor.points}</span>
            <div>
              <strong>{factor.label}</strong>
              <span>{factor.explanation}</span>
              <small>{factorValue(factor)}</small>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}
