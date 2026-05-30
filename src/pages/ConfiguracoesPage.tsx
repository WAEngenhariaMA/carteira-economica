import { useState } from "react";
import { Bot, Database, Landmark, LockKeyhole, PieChart, SlidersHorizontal } from "lucide-react";
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

const settingsTabs = [
  {
    id: "premissas",
    label: "Premissas",
    description: "Nome, carteira, objetivo e perfil financeiro.",
    icon: SlidersHorizontal,
  },
  {
    id: "catalogo",
    label: "Catálogo",
    description: "Categorias, subcategorias e palavras-chave.",
    icon: Landmark,
  },
  {
    id: "ia",
    label: "Inteligência Artificial",
    description: "Modo gratuito, IA local e opções avançadas.",
    icon: Bot,
  },
  {
    id: "sistema",
    label: "Sistema",
    description: "Infraestrutura, segurança e cálculos automáticos.",
    icon: Database,
  },
] as const;

type SettingsTabId = (typeof settingsTabs)[number]["id"];

export function ConfiguracoesPage({
  userId,
  workspace,
  refresh,
}: WorkspacePageProps) {
  const [activeTab, setActiveTab] = useState<SettingsTabId>("premissas");

  return (
    <div className="screen-stack">
      <Panel title="Configurações da Plataforma">
        <div className="settings-tabbar">
          {settingsTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                className={`settings-tab ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={16} />
                <div>
                  <strong>{tab.label}</strong>
                  <span>{tab.description}</span>
                </div>
              </button>
            );
          })}
        </div>
      </Panel>

      {activeTab === "premissas" && (
        <Panel title="Premissas Financeiras">
          <ProfileFinancialSettingsForm
            profile={workspace.profile}
            onSubmit={async (profile) => {
              await profileService.update(userId, workspace.profile.id, profile);
              refresh();
            }}
          />
        </Panel>
      )}

      {activeTab === "catalogo" && (
        <Panel title="Catálogo Financeiro">
          <CategoryManager
            userId={userId}
            categories={workspace.categories}
            onChange={refresh}
          />
        </Panel>
      )}

      {activeTab === "ia" && (
        <Panel title="Inteligência Artificial">
          <AiSettingsPanel />
        </Panel>
      )}

      {activeTab === "sistema" && (
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
      )}
    </div>
  );
}
