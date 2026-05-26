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
  searchQuery: string;
  refresh: () => void;
}

export const navItems: Array<{ id: ScreenId; label: string; icon: LucideIcon }> = [
  { id: "dashboard", label: "Painel", icon: LayoutDashboard },
  { id: "receitas", label: "Receitas", icon: Banknote },
  { id: "despesas", label: "Despesas", icon: ReceiptText },
  { id: "cartoes", label: "Cartões", icon: WalletCards },
  { id: "faturas", label: "Faturas do cartão", icon: CreditCard },
  { id: "parcelas", label: "Parcelamentos", icon: Rows3 },
  { id: "importador", label: "Importador Excel", icon: Upload },
  { id: "diagnostico", label: "Diagnóstico IA", icon: Brain },
  { id: "plano", label: "Plano de ação", icon: ListChecks },
  { id: "metas", label: "Metas", icon: Target },
  { id: "alertas", label: "Alertas", icon: Bell },
  { id: "simulador", label: "Simulador", icon: Calculator },
  { id: "relatorios", label: "Relatório PDF", icon: FileText },
  { id: "configuracoes", label: "Configurações", icon: Settings },
];

export const screenTitles: Record<ScreenId, string> = {
  dashboard: "Painel Executivo",
  receitas: "Receitas",
  despesas: "Despesas",
  cartoes: "Cartões",
  faturas: "Faturas do Cartão",
  parcelas: "Parcelamentos",
  importador: "Importador Inteligente",
  diagnostico: "Diagnóstico Financeiro",
  plano: "Plano de Ação",
  metas: "Metas",
  alertas: "Alertas Inteligentes",
  simulador: "Simulador",
  relatorios: "Relatórios",
  configuracoes: "Configurações",
};
