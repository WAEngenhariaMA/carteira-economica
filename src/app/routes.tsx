import {
  Bell,
  Brain,
  Calculator,
  Gauge,
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

export interface NavItem {
  id: ScreenId;
  label: string;
  icon: LucideIcon;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const navItems: NavItem[] = [
  { id: "dashboard", label: "Painel", icon: LayoutDashboard },
  { id: "indicadores", label: "Indicadores", icon: Gauge },
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

const navItemById = new Map(navItems.map((item) => [item.id, item]));

function groupItems(ids: ScreenId[]): NavItem[] {
  return ids
    .map((id) => navItemById.get(id))
    .filter((item): item is NavItem => Boolean(item));
}

export const navGroups: NavGroup[] = [
  {
    title: "Central Executiva",
    items: groupItems(["dashboard", "indicadores"]),
  },
  {
    title: "Fluxo Financeiro",
    items: groupItems(["receitas", "despesas"]),
  },
  {
    title: "Crédito e Dívidas",
    items: groupItems(["cartoes", "faturas", "parcelas"]),
  },
  {
    title: "Inteligência e Decisão",
    items: groupItems(["importador", "diagnostico", "plano", "alertas", "simulador"]),
  },
  {
    title: "Planejamento",
    items: groupItems(["metas", "relatorios"]),
  },
  {
    title: "Administração",
    items: groupItems(["configuracoes"]),
  },
];

export const screenTitles: Record<ScreenId, string> = {
  dashboard: "Painel Executivo",
  indicadores: "Indicadores de Decisão",
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
