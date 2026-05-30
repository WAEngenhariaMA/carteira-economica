import clsx from "clsx";
import type { ScreenId } from "../../types/finance";
import { navGroups } from "../../app/routes";

export function Sidebar({ activeScreen, onSelect }: { activeScreen: ScreenId; onSelect: (screen: ScreenId) => void }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">CE</div>
        <div>
          <strong>Carteira Econômica IA</strong>
          <span>Sistema de Inteligência Financeira</span>
        </div>
      </div>

      <nav className="sidebar-nav grouped" aria-label="Navegação principal">
        {navGroups.map((group) => (
          <section className="nav-group" key={group.title} aria-label={group.title}>
            <span className="nav-group-title">{group.title}</span>
            <div className="nav-group-items">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    className={clsx("nav-button", activeScreen === item.id && "active")}
                    type="button"
                    onClick={() => onSelect(item.id)}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span className="risk-pill risk-healthy">Sessão protegida</span>
        <span>Dados carregados via Supabase RLS</span>
      </div>
    </aside>
  );
}
