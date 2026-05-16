import { Target, Trash2 } from "lucide-react";
import { GoalForm } from "../components/forms/GoalForm";
import { IconBadge, Panel, RiskPill } from "../components/ui/FinanceUI";
import { formatMoney } from "../lib/formatters";
import { goalService } from "../services/goalService";
import type { WorkspacePageProps } from "../app/routes";

export function MetasPage({ userId, workspace, refresh }: WorkspacePageProps) {
  return (
    <div className="screen-stack">
      <Panel title="Cadastrar Meta">
        <GoalForm
          onSubmit={async (goal) => {
            await goalService.create(userId, goal);
            refresh();
          }}
        />
      </Panel>
      <div className="goal-grid">
        {workspace.goals.map((goal) => {
          const progress = goal.target > 0 ? goal.current / goal.target : 0;
          return (
            <Panel key={goal.id}>
              <div className="goal-card">
                <div className="goal-head">
                  <IconBadge icon={Target} tone={goal.priority === "urgent" ? "danger" : "neutral"} />
                  <RiskPill level={goal.priority} />
                </div>
                <h3>{goal.name}</h3>
                <strong>{formatMoney(goal.current)} / {formatMoney(goal.target)}</strong>
                <div className="goal-track"><i style={{ width: `${Math.min(progress * 100, 100)}%` }} /></div>
                <span>Prazo {goal.deadline}</span>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={async () => {
                    await goalService.remove(userId, goal.id);
                    refresh();
                  }}
                >
                  <Trash2 size={15} />
                  Excluir
                </button>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
