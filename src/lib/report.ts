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
import type { FinancialExplanation } from "./financialExplainer";
import { formatMoney, formatPercent, riskLabel } from "./formatters";

interface ReportInput {
  profile: FinancialProfile;
  summary: FinancialSummary;
  diagnostics: DiagnosticFinding[];
  alerts: AlertItem[];
  actions: ActionItem[];
  cards: Card[];
  explanation: FinancialExplanation;
  providerLabel?: string;
  fallbackUsed?: boolean;
}

export function generateExecutivePdf({
  profile,
  summary,
  diagnostics,
  alerts,
  actions,
  cards,
  explanation,
  providerLabel = "Regras Puras",
  fallbackUsed = false,
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
    `Saldo projetado: ${formatMoney(summary.projectedBalance)} | Caixa realizado: ${formatMoney(summary.realizedBalance)} | A receber: ${formatMoney(summary.pendingIncome)}`,
    14,
    74,
  );
  doc.setFontSize(9);
  doc.text(doc.splitTextToSize(explanation.simpleMonthSummary, pageWidth - 28), 14, 83);
  doc.text(doc.splitTextToSize(explanation.plainLanguageConclusion, pageWidth - 28), 14, 94);

  autoTable(doc, {
    startY: 108,
    head: [["Indicador", "Valor", "Interpretação"]],
    body: [
      ["Renda do mês", formatMoney(summary.expectedIncome), "Recebida + pendente na competência"],
      ["Receita recebida no mês", formatMoney(summary.confirmedIncome), "Caixa confirmado"],
      ["Receita a receber no mês", formatMoney(summary.pendingIncome), "Risco de realização"],
      ["Despesas pendentes no mês", formatMoney(summary.pendingDirectExpenses), "Contas diretas abertas ou agendadas"],
      ["Obrigações abertas no mês", formatMoney(summary.monthlyOpenObligations), "Pendências, faturas abertas e dívidas"],
      ["Caixa sem cobertura", formatMoney(summary.cashShortfall), "Obrigações abertas acima do caixa confirmado"],
      ["Faturas do mês", formatMoney(summary.cardInvoices), "Total da competência"],
      ["Faturas abertas do mês", formatMoney(summary.openCardInvoices), "Pressão de curto prazo"],
      ["Dívidas mensais", formatMoney(summary.debtPayments), "Obrigação recorrente da competência"],
      ["Compromissos futuros", formatMoney(summary.futureCommitmentsTotal), "Faturas, parcelas, fixos, recorrentes, dívidas e empréstimos"],
      ["Saldo previsto", formatMoney(summary.projectedBalance), "Fluxo após compromissos"],
      ["Regra adaptativa", summary.adaptiveBudget.label, "Modelo recomendado para o momento"],
      ["Gasto diário seguro", formatMoney(summary.safeDailySpend), "Valor recomendado para não piorar o saldo"],
      ["Gasto semanal seguro", formatMoney(summary.safeWeeklySpend), "Teto semanal recomendado"],
      ["Valor urgente", formatMoney(summary.urgentAmount), "Valor a resolver antes dos vencimentos"],
      ["Renda ideal automática", formatMoney(summary.automaticIdealIncome.amount), summary.automaticIdealIncome.explanation],
      ["Reserva recomendada", formatMoney(summary.reserveTargets.selectedTarget), summary.reserveTargets.explanation],
      ["Qualidade dos dados", `${summary.dataQualityScore}/100`, summary.dataReliabilityLabel],
      ["Provider do diagnóstico", providerLabel, fallbackUsed ? "Fallback utilizado" : "Sem fallback"],
    ],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [15, 118, 110] },
  });

  autoTable(doc, {
    head: [["Leitura consultiva", "Explicação"]],
    body: [
      ["Nota financeira", explanation.scoreExplanation],
      ["Comprometimento", explanation.commitmentExplanation],
      ["Saldo do mês", explanation.balanceExplanation],
      ["Cartões", explanation.cardsExplanation],
      ["Parcelas futuras", explanation.installmentsExplanation],
      ["Conclusão executiva", explanation.plainLanguageConclusion],
    ],
    styles: { fontSize: 8.5 },
    headStyles: { fillColor: [15, 118, 110] },
  });

  autoTable(doc, {
    head: [["Por que a nota caiu", "Leitura"]],
    body: explanation.scoreDroppedReasons.map((item) => ["Fator de score", item]),
    styles: { fontSize: 8.5 },
    headStyles: { fillColor: [180, 83, 9] },
  });

  autoTable(doc, {
    head: [["O que fazer primeiro", "Impacto"]],
    body: explanation.whatToDoFirst.map((item) => [item.title, item.impact]),
    styles: { fontSize: 8.5 },
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
    head: [["Plano de ação", "Prazo", "Primeiro passo", "Economia estimada"]],
    body: [
      ...explanation.horizonPlan.map((item) => [
        item.title,
        item.horizon,
        item.firstStep,
        formatMoney(item.expectedImpact),
      ]),
      ...actions.map((item) => [
      item.title,
      item.horizon,
      item.firstStep ?? riskLabel(item.priority),
      formatMoney(item.expectedSavings),
      ]),
    ],
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
