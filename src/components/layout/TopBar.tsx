import { Download, Filter, LogOut, Search } from "lucide-react";
import clsx from "clsx";
import type { FinancialSummary, ScreenId } from "../../types/finance";
import { screenTitles } from "../../app/routes";

function scoreTone(score: number) {
  if (score >= 70) return "good";
  if (score >= 50) return "warn";
  return "danger";
}

export function TopBar({
  activeScreen,
  competence,
  summary,
  onCompetenceChange,
  onReport,
  onLogout,
}: {
  activeScreen: ScreenId;
  competence: string;
  summary: FinancialSummary;
  onCompetenceChange: (competence: string) => void;
  onReport: () => void;
  onLogout: () => void;
}) {
  return (
    <header className="topbar">
      <div>
        <label className="month-filter">
          Competência
          <input value={competence} type="month" onChange={(event) => onCompetenceChange(event.target.value)} />
        </label>
        <h1>{screenTitles[activeScreen]}</h1>
      </div>

      <div className="topbar-actions">
        <label className="searchbox">
          <Search size={17} />
          <input placeholder="Buscar lançamentos, cartões, categorias" />
        </label>
        <button className="ghost-button" type="button">
          <Filter size={17} />
          Filtros
        </button>
        <button className="primary-button" type="button" onClick={onReport}>
          <Download size={17} />
          Gerar PDF
        </button>
        <div className={clsx("score-chip", scoreTone(summary.healthScore))}>
          <span>{summary.healthScore}/100</span>
        </div>
        <button className="ghost-button icon-only" type="button" onClick={onLogout} aria-label="Sair">
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
}
