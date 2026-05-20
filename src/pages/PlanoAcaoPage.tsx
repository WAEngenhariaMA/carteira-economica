import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { ActionForm } from "../components/forms/ActionForm";
import { Panel, RiskPill, StatusPill } from "../components/ui/FinanceUI";
import { difficultyLabel, formatMoney } from "../lib/formatters";
import { actionPlanService } from "../services/actionPlanService";
import type { WorkspacePageProps } from "../app/routes";
import type { ActionItem } from "../types/finance";

export function PlanoAcaoPage({ userId, workspace, refresh }: WorkspacePageProps) {
  const [editing, setEditing] = useState<ActionItem | null>(null);

  return (
    <div className="screen-stack">
      <Panel title={editing ? "Editar Ação Operacional" : "Cadastrar Ação Operacional"}>
        <ActionForm
          initialValue={editing}
          onCancel={() => setEditing(null)}
          onSubmit={async (action) => {
            if (editing) {
              await actionPlanService.update(userId, editing.id, action);
              setEditing(null);
            } else {
              await actionPlanService.create(userId, action);
            }
            refresh();
          }}
        />
      </Panel>
      <Panel title="Ações Priorizadas" className="table-panel">
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ação</th>
                <th>Prazo</th>
                <th>Prioridade</th>
                <th>Dificuldade</th>
                <th>Status</th>
                <th className="num">Impacto</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {workspace.actions.map((action) => (
                <tr key={action.id}>
                  <td>
                    <strong>{action.title}</strong>
                    <span>{action.reason}</span>
                  </td>
                  <td>{action.horizon}</td>
                  <td><RiskPill level={action.priority} /></td>
                  <td>{difficultyLabel(action.difficulty)}</td>
                  <td><StatusPill status={action.status} /></td>
                  <td className="num">{formatMoney(action.expectedSavings)}</td>
                  <td className="table-actions">
                    <button className="ghost-button icon-only" type="button" aria-label="Editar ação" onClick={() => setEditing(action)}>
                      <Pencil size={15} />
                    </button>
                    <button
                      className="ghost-button icon-only"
                      type="button"
                      aria-label="Excluir ação"
                      onClick={async () => {
                        await actionPlanService.remove(userId, action.id);
                        if (editing?.id === action.id) setEditing(null);
                        refresh();
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
