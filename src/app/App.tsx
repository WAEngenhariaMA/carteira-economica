import { useMemo, useState } from "react";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { AuthProvider } from "../contexts/AuthContext";
import { useAuth } from "../hooks/useAuth";
import { AppShell } from "./AppShell";
import { currentCompetence } from "../services/dateService";
import { useFinancialWorkspace } from "../hooks/useFinancialWorkspace";
import { buildAlerts, buildDiagnostics } from "../lib/financeEngine";
import { reportService } from "../services/reportService";
import type { ScreenId } from "../types/finance";
import { AuthPage } from "../pages/AuthPage";
import { SupabaseSetupPage } from "../pages/SupabaseSetupPage";
import { ProfileSetupPage } from "../pages/ProfileSetupPage";
import { DashboardPage } from "../pages/DashboardPage";
import { ReceitasPage } from "../pages/ReceitasPage";
import { DespesasPage } from "../pages/DespesasPage";
import { CartoesPage } from "../pages/CartoesPage";
import { FaturasPage } from "../pages/FaturasPage";
import { ParcelasPage } from "../pages/ParcelasPage";
import { ImportadorPage } from "../pages/ImportadorPage";
import { DiagnosticoPage } from "../pages/DiagnosticoPage";
import { PlanoAcaoPage } from "../pages/PlanoAcaoPage";
import { MetasPage } from "../pages/MetasPage";
import { AlertasPage } from "../pages/AlertasPage";
import { SimuladorPage } from "../pages/SimuladorPage";
import { RelatoriosPage } from "../pages/RelatoriosPage";
import { ConfiguracoesPage } from "../pages/ConfiguracoesPage";
import { ErrorState, LoadingState } from "../components/ui/FinanceUI";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
);

function ProtectedApp() {
  const auth = useAuth();
  const [activeScreen, setActiveScreen] = useState<ScreenId>("dashboard");
  const [competence, setCompetence] = useState(currentCompetence());
  const workspaceState = useFinancialWorkspace(auth.user?.id, competence);

  const pageProps = useMemo(() => {
    if (!auth.user || !workspaceState.data || !workspaceState.summary) return null;
    return {
      userId: auth.user.id,
      competence,
      workspace: workspaceState.data,
      summary: workspaceState.summary,
      refresh: workspaceState.refresh,
    };
  }, [auth.user, competence, workspaceState.data, workspaceState.refresh, workspaceState.summary]);

  if (!auth.configured) return <SupabaseSetupPage />;
  if (auth.loading) return <LoadingState label="Validando sessao" />;
  if (!auth.session || !auth.user) return <AuthPage />;
  if (workspaceState.loading) return <LoadingState />;
  if (workspaceState.error) return <ErrorState message={workspaceState.error} onRetry={workspaceState.refresh} />;
  if (!workspaceState.data || !workspaceState.summary || !pageProps) {
    return <ProfileSetupPage onSubmit={workspaceState.createProfile} />;
  }

  const handleReport = async () => {
    const diagnostics = buildDiagnostics(pageProps.summary, pageProps.workspace.cards, pageProps.workspace.debts);
    const alerts = buildAlerts(pageProps.summary, pageProps.workspace.cards);
    const { generateExecutivePdf } = await import("../lib/report");

    generateExecutivePdf({
      profile: pageProps.workspace.profile,
      summary: pageProps.summary,
      diagnostics,
      alerts,
      actions: pageProps.workspace.actions,
      cards: pageProps.workspace.cards,
    });

    await reportService.register(pageProps.userId, competence, {
      healthScore: pageProps.summary.healthScore,
      riskLevel: pageProps.summary.riskLevel,
      diagnostics: diagnostics.length,
      alerts: alerts.length,
    });
  };

  const renderScreen = () => {
    if (activeScreen === "dashboard") return <DashboardPage {...pageProps} />;
    if (activeScreen === "receitas") return <ReceitasPage {...pageProps} />;
    if (activeScreen === "despesas") return <DespesasPage {...pageProps} />;
    if (activeScreen === "cartoes") return <CartoesPage {...pageProps} />;
    if (activeScreen === "faturas") return <FaturasPage {...pageProps} />;
    if (activeScreen === "parcelas") return <ParcelasPage {...pageProps} />;
    if (activeScreen === "importador") return <ImportadorPage {...pageProps} />;
    if (activeScreen === "diagnostico") return <DiagnosticoPage {...pageProps} />;
    if (activeScreen === "plano") return <PlanoAcaoPage {...pageProps} />;
    if (activeScreen === "metas") return <MetasPage {...pageProps} />;
    if (activeScreen === "alertas") return <AlertasPage {...pageProps} />;
    if (activeScreen === "simulador") return <SimuladorPage {...pageProps} />;
    if (activeScreen === "relatorios") return <RelatoriosPage {...pageProps} onReport={handleReport} />;
    return <ConfiguracoesPage {...pageProps} />;
  };

  return (
    <AppShell
      activeScreen={activeScreen}
      competence={competence}
      summary={pageProps.summary}
      onScreenChange={setActiveScreen}
      onCompetenceChange={setCompetence}
      onReport={handleReport}
      onLogout={auth.signOut}
    >
      {renderScreen()}
    </AppShell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProtectedApp />
    </AuthProvider>
  );
}
