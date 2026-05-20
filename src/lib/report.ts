import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  ActionItem,
  AlertItem,
  Card,
  DiagnosticFinding,
  FinancialProfile,
  FinancialSummary,
} from "../types/finance";
import { formatMoney, formatPercent, riskLabel } from "./formatters";

interface ReportInput {
  profile: FinancialProfile;
  summary: FinancialSummary;
  diagnostics: DiagnosticFinding[];
  alerts: AlertItem[];
  actions: ActionItem[];
  cards: Card[];
}

export function generateExecutivePdf({
  profile,
  summary,
  diagnostics,
  alerts,
  actions,
  cards,
}: ReportInput) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(11, 23, 38);
  doc.rect(0, 0, pageWidth, 44, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(19);
  doc.text("Carteira Econômica IA", 14, 18);
  doc.setFontSize(11);
  doc.text("Relatório executivo de diagnóstico e planejamento financeiro pessoal", 14, 29);
  doc.text(`Cliente: ${profile.ownerName}`, 14, 37);

  doc.setTextColor(20, 31, 46);
  doc.setFontSize(14);
  doc.text("Resumo executivo", 14, 58);
  doc.setFontSize(10);
  doc.text(
    `Status: ${riskLabel(summary.riskLevel)} | Pontuação: ${summary.healthScore}/100 | Comprometimento: ${formatPercent(summary.committedIncomeRatio)}`,
    14,
    67,
  );
  doc.text(
    `Saldo projetado: ${formatMoney(summary.projectedBalance)} | Economia potencial: ${formatMoney(summary.potentialSavings)}`,
    14,
    74,
  );

  autoTable(doc, {
    startY: 84,
    head: [["Indicador", "Valor", "Interpretação"]],
    body: [
      ["Renda mensal", formatMoney(summary.income), "Base de capacidade financeira"],
      ["Faturas abertas", formatMoney(summary.cardInvoices), "Pressão de curto prazo"],
      ["Dívidas mensais", formatMoney(summary.debtPayments), "Obrigação recorrente"],
      ["Saldo previsto", formatMoney(summary.projectedBalance), "Fluxo após compromissos"],
      ["Regra adaptativa", summary.adaptiveBudget.label, "Modelo recomendado para o momento"],
    ],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [15, 118, 110] },
  });

  autoTable(doc, {
    head: [["Diagnóstico", "Gravidade", "Leitura executiva"]],
    body: diagnostics.map((item) => [item.title, riskLabel(item.severity), item.description]),
    styles: { fontSize: 8.5 },
    headStyles: { fillColor: [11, 23, 38] },
  });

  autoTable(doc, {
    head: [["Cartão", "Fatura", "Limite", "Vencimento", "Juros a.m."]],
    body: cards.map((card) => [
      card.bank,
      formatMoney(card.currentInvoice),
      formatMoney(card.limit),
      `Dia ${card.dueDay}`,
      `${card.interestRateMonth.toFixed(1)}%`,
    ]),
    styles: { fontSize: 8.5 },
    headStyles: { fillColor: [20, 31, 46] },
  });

  autoTable(doc, {
    head: [["Plano de ação", "Prazo", "Prioridade", "Economia estimada"]],
    body: actions.map((item) => [
      item.title,
      item.horizon,
      riskLabel(item.priority),
      formatMoney(item.expectedSavings),
    ]),
    styles: { fontSize: 8.5 },
    headStyles: { fillColor: [15, 118, 110] },
  });

  autoTable(doc, {
    head: [["Alertas ativos", "Nível", "Mensagem"]],
    body: alerts.map((alert) => [alert.title, riskLabel(alert.level), alert.message]),
    styles: { fontSize: 8.5 },
    headStyles: { fillColor: [180, 83, 9] },
  });

  doc.save(`carteira-economica-ia-${profile.ownerName.toLowerCase()}.pdf`);
}
