import {
  Bell,
  Brain,
  Calculator,
  CreditCard,
  FileText,
  LayoutDashboard,
  ListChecks,
  ReceiptText,
  Rows3,
  Settings,
  Target,
  Upload,
  WalletCards,
  Banknote,
  type LucideIcon,
} from "lucide-react";
import type { FinancialSummary, FinancialWorkspace, ScreenId } from "../types/finance";

export interface WorkspacePageProps {
  userId: string;
  competence: string;
  workspace: FinancialWorkspace;
  summary: FinancialSummary;
  refresh: () => void;
}

export const navItems: Array<{ id: ScreenId; label: string; icon: LucideIcon }> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "receitas", label: "Receitas", icon: Banknote },
  { id: "despesas", label: "Despesas", icon: ReceiptText },
  { id: "cartoes", label: "Cartoes", icon: WalletCards },
  { id: "faturas", label: "Faturas", icon: CreditCard },
  { id: "parcelas", label: "Parcelas futuras", icon: Rows3 },
  { id: "importador", label: "Importador Excel", icon: Upload },
  { id: "diagnostico", label: "Diagnostico IA", icon: Brain },
  { id: "plano", label: "Plano de acao", icon: ListChecks },
  { id: "metas", label: "Metas", icon: Target },
  { id: "alertas", label: "Alertas", icon: Bell },
  { id: "simulador", label: "Simulador", icon: Calculator },
  { id: "relatorios", label: "Relatorio PDF", icon: FileText },
  { id: "configuracoes", label: "Configuracoes", icon: Settings },
];

export const screenTitles: Record<ScreenId, string> = {
  dashboard: "Dashboard Executivo",
  receitas: "Receitas",
  despesas: "Despesas",
  cartoes: "Cartoes",
  faturas: "Faturas",
  parcelas: "Parcelas Futuras",
  importador: "Importador Inteligente",
  diagnostico: "Diagnostico Financeiro",
  plano: "Plano de Acao",
  metas: "Metas",
  alertas: "Alertas Inteligentes",
  simulador: "Simulador",
  relatorios: "Relatorios",
  configuracoes: "Configuracoes",
};
