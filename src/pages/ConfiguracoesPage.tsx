import { Database, Landmark, LockKeyhole, PieChart } from "lucide-react";
import { ProfileFinancialSettingsForm } from "../components/forms/ProfileFinancialSettingsForm";
import { AiSettingsPanel } from "../components/settings/AiSettingsPanel";
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

      <Panel title="Inteligência Artificial">
        <AiSettingsPanel />
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

        <Panel title="Cálculos Automáticos">
          <div className="config-list">
            <ConfigRow
              icon={PieChart}
              title="Meta de reserva"
              value="Calculada pelo custo essencial mensal x meses desejados"
            />
            <ConfigRow
              icon={Landmark}
              title="Renda ideal"
              value="Calculada pelo momento financeiro, faturas, dívidas e margem de recuperação"
            />
            <ConfigRow
              icon={LockKeyhole}
              title="Segurança"
              value="Nenhuma chave secreta é usada no front-end"
            />
          </div>
        </Panel>
      </div>
    </div>
  );
}
