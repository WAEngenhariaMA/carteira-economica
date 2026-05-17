import { useState } from "react";
import { Pencil, Target, Trash2 } from "lucide-react";
import { GoalForm } from "../components/forms/GoalForm";
import { IconBadge, Panel, RiskPill } from "../components/ui/FinanceUI";
import { formatMoney } from "../lib/formatters";
import { goalService } from "../services/goalService";
import type { WorkspacePageProps } from "../app/routes";
import type { Goal } from "../types/finance";

export function MetasPage({ userId, workspace, refresh }: WorkspacePageProps) {
  const [editing, setEditing] = useState<Goal | null>(null);

  return (
    <div className="screen-stack">
      <Panel title={editing ? "Editar Meta" : "Cadastrar Meta"}>
        <GoalForm
          initialValue={editing}
          onCancel={() => setEditing(null)}
          onSubmit={async (goal) => {
            if (editing) {
              await goalService.update(userId, editing.id, goal);
              setEditing(null);
            } else {
              await goalService.create(userId, goal);
            }
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
                <div className="goal-actions">
                  <button className="ghost-button" type="button" onClick={() => setEditing(goal)}>
                    <Pencil size={15} />
                    Editar
                  </button>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={async () => {
                      await goalService.remove(userId, goal.id);
                      if (editing?.id === goal.id) setEditing(null);
                      refresh();
                    }}
                  >
                    <Trash2 size={15} />
                    Excluir
                  </button>
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
