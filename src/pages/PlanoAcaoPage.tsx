import { ActionForm } from "../components/forms/ActionForm";
import { Panel, RiskPill } from "../components/ui/FinanceUI";
import { formatMoney } from "../lib/formatters";
import { actionPlanService } from "../services/actionPlanService";
import type { WorkspacePageProps } from "../app/routes";

export function PlanoAcaoPage({ userId, workspace, refresh }: WorkspacePageProps) {
  return (
    <div className="screen-stack">
      <Panel title="Cadastrar Acao Operacional">
        <ActionForm
          onSubmit={async (action) => {
            await actionPlanService.create(userId, action);
            refresh();
          }}
        />
      </Panel>
      <Panel title="Acoes Priorizadas" className="table-panel">
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Acao</th>
                <th>Prazo</th>
                <th>Prioridade</th>
                <th>Dificuldade</th>
                <th>Status</th>
                <th className="num">Impacto</th>
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
                  <td>{action.difficulty}</td>
                  <td>{action.status}</td>
                  <td className="num">{formatMoney(action.expectedSavings)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
