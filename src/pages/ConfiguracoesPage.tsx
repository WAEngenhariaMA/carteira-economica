import { Brain, Database, Landmark, LockKeyhole, PieChart } from "lucide-react";
import { ProfileFinancialSettingsForm } from "../components/forms/ProfileFinancialSettingsForm";
import { CategoryManager } from "../components/settings/CategoryManager";
import { IconBadge, Panel } from "../components/ui/FinanceUI";
import { profileService } from "../services/profileService";
import type { WorkspacePageProps } from "../app/routes";

function ConfigRow({
  icon,
  title,
  value,
}: {
  icon: typeof Database;
  title: string;
  value: string;
}) {
  return (
    <article className="config-row">
      <IconBadge icon={icon} tone="neutral" />
      <div>
        <strong>{title}</strong>
        <span>{value}</span>
      </div>
    </article>
  );
}

export function ConfiguracoesPage({
  userId,
  workspace,
  refresh,
}: WorkspacePageProps) {
  return (
    <div className="screen-stack">
      <Panel title="Premissas Financeiras">
        <ProfileFinancialSettingsForm
          profile={workspace.profile}
          onSubmit={async (profile) => {
            await profileService.update(userId, workspace.profile.id, profile);
            refresh();
          }}
        />
      </Panel>

      <Panel title="Catálogo Financeiro">
        <CategoryManager
          userId={userId}
          categories={workspace.categories}
          onChange={refresh}
        />
      </Panel>

      <div className="dashboard-grid">
        <Panel title="Infraestrutura">
          <div className="config-list">
            <ConfigRow
              icon={Database}
              title="Supabase"
              value="Ativo com usuário autenticado e RLS"
            />
            <ConfigRow
              icon={LockKeyhole}
              title="Autenticação"
              value={`Perfil: ${workspace.profile.ownerName}`}
            />
            <ConfigRow
              icon={Landmark}
              title="Modelo de dados"
              value="Schema SQL com tabelas financeiras, auditoria e qualidade"
            />
            <ConfigRow
              icon={PieChart}
              title="BI financeiro"
              value="Motor local preparado para Edge Functions"
            />
          </div>
        </Panel>

        <Panel title="Próximas Funções IA">
          <div className="roadmap-list">
            <span>
              <Brain size={16} /> classify-transaction
            </span>
            <span>
              <Brain size={16} /> generate-diagnostic
            </span>
            <span>
              <Brain size={16} /> generate-action-plan
            </span>
            <span>
              <Brain size={16} /> generate-report-text
            </span>
          </div>
        </Panel>
      </div>
    </div>
  );
}
