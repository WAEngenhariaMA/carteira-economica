import { useState } from "react";
import { Clock3, Gauge, TableProperties, Wallet } from "lucide-react";
import { MetricCard, Panel } from "../components/ui/FinanceUI";
import { buildScenario } from "../lib/financeEngine";
import { formatMoney, formatPercent } from "../lib/formatters";
import type { WorkspacePageProps } from "../app/routes";

function scoreTone(score: number) {
  if (score >= 70) return "good";
  if (score >= 50) return "warn";
  return "danger";
}

export function SimuladorPage({ summary }: WorkspacePageProps) {
  const [monthlyCut, setMonthlyCut] = useState(900);
  const [incomeIncrease, setIncomeIncrease] = useState(600);
  const scenario = buildScenario(summary, monthlyCut, incomeIncrease);

  return (
    <div className="dashboard-grid">
      <Panel title="Premissas do Cenário">
        <div className="sim-controls">
          <label>
            <span>Corte mensal</span>
            <strong>{formatMoney(monthlyCut)}</strong>
            <input min="0" max="3000" step="50" type="range" value={monthlyCut} onChange={(event) => setMonthlyCut(Number(event.target.value))} />
          </label>
          <label>
            <span>Renda extra</span>
            <strong>{formatMoney(incomeIncrease)}</strong>
            <input min="0" max="4000" step="50" type="range" value={incomeIncrease} onChange={(event) => setIncomeIncrease(Number(event.target.value))} />
          </label>
        </div>
      </Panel>
      <Panel title="Resultado Simulado">
        <div className="scenario-grid">
          <MetricCard icon={Wallet} label="Saldo ajustado" value={formatMoney(scenario.adjustedBalance)} helper="Após cortes e renda extra" tone={scenario.adjustedBalance > 0 ? "good" : "danger"} />
          <MetricCard icon={Gauge} label="Nova Pontuação" value={`${Math.round(scenario.adjustedScore)}/100`} helper="Estimativa por regras" tone={scoreTone(scenario.adjustedScore)} />
          <MetricCard icon={Clock3} label="Recuperação" value={`${scenario.recoveryMonths} meses`} helper="Para zerar dívida prioritária" tone={scenario.recoveryMonths <= 3 ? "good" : "warn"} />
          <MetricCard icon={TableProperties} label="Comprometimento" value={formatPercent(scenario.adjustedCommitment)} helper="Novo peso da renda" tone={scenario.adjustedCommitment > 0.7 ? "danger" : "good"} />
        </div>
      </Panel>
    </div>
  );
}
