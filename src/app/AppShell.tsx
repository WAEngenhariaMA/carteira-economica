import { Sidebar } from "../components/layout/Sidebar";
import { TopBar } from "../components/layout/TopBar";
import { formatMoney } from "../lib/formatters";
import type { FinancialSummary, ScreenId } from "../types/finance";

export function AppShell({
  activeScreen,
  competence,
  summary,
  searchQuery,
  children,
  onScreenChange,
  onCompetenceChange,
  onSearchChange,
  onReport,
  onLogout,
}: {
  activeScreen: ScreenId;
  competence: string;
  summary: FinancialSummary;
  searchQuery: string;
  children: React.ReactNode;
  onScreenChange: (screen: ScreenId) => void;
  onCompetenceChange: (competence: string) => void;
  onSearchChange: (value: string) => void;
  onReport: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="app-shell">
      <Sidebar activeScreen={activeScreen} onSelect={onScreenChange} />
      <main className="main-area">
        <TopBar
          activeScreen={activeScreen}
          competence={competence}
          summary={summary}
          searchQuery={searchQuery}
          onCompetenceChange={onCompetenceChange}
          onSearchChange={onSearchChange}
          onReport={onReport}
          onLogout={onLogout}
        />
        <div className="content-area">{children}</div>
        <footer className="app-footer">
          <span>Saldo previsto do mês: {formatMoney(summary.projectedBalance)}</span>
          <span>Gasto médio diário do mês: {formatMoney(summary.dailyAverageSpend)}</span>
          <span>Gasto médio semanal do mês: {formatMoney(summary.weeklyAverageSpend)}</span>
        </footer>
      </main>
    </div>
  );
}
