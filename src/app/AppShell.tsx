import { Sidebar } from "../components/layout/Sidebar";
import { TopBar } from "../components/layout/TopBar";
import { formatMoney } from "../lib/formatters";
import type { FinancialSummary, ScreenId } from "../types/finance";

export function AppShell({
  activeScreen,
  competence,
  summary,
  children,
  onScreenChange,
  onCompetenceChange,
  onReport,
  onLogout,
}: {
  activeScreen: ScreenId;
  competence: string;
  summary: FinancialSummary;
  children: React.ReactNode;
  onScreenChange: (screen: ScreenId) => void;
  onCompetenceChange: (competence: string) => void;
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
          onCompetenceChange={onCompetenceChange}
          onReport={onReport}
          onLogout={onLogout}
        />
        <div className="content-area">{children}</div>
        <footer className="app-footer">
          <span>Saldo previsto: {formatMoney(summary.projectedBalance)}</span>
          <span>Gasto medio diario: {formatMoney(summary.dailyAverageSpend)}</span>
          <span>Gasto medio semanal: {formatMoney(summary.weeklyAverageSpend)}</span>
        </footer>
      </main>
    </div>
  );
}
