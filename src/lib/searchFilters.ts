import type { Card, FinancialCategory, Installment, Invoice, Transaction } from "../types/finance";

export function normalizeSearch(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function containsQuery(query: string, values: Array<string | number | undefined>) {
  if (!query) return true;
  return values.some((value) => normalizeSearch(String(value ?? "")).includes(query));
}

export function matchesTransactionSearch(transaction: Transaction, query: string) {
  const normalized = normalizeSearch(query);
  return containsQuery(normalized, [
    transaction.description,
    transaction.category,
    transaction.subcategory,
    transaction.bank,
    transaction.paymentRail,
    transaction.status,
    transaction.essentiality,
    transaction.notes,
    transaction.amount,
  ]);
}

export function matchesCardSearch(card: Card, query: string) {
  const normalized = normalizeSearch(query);
  return containsQuery(normalized, [card.bank, card.name, card.limit, card.currentInvoice]);
}

export function matchesInvoiceSearch(invoice: Invoice, card: Card | undefined, query: string) {
  const normalized = normalizeSearch(query);
  return containsQuery(normalized, [
    card?.bank,
    card?.name,
    invoice.competence,
    invoice.dueDate,
    invoice.status,
    invoice.totalAmount,
  ]);
}

export function matchesInstallmentSearch(installment: Installment, card: Card | undefined, query: string) {
  const normalized = normalizeSearch(query);
  return containsQuery(normalized, [
    installment.description,
    installment.category,
    installment.creditor,
    installment.source,
    installment.competence,
    installment.status,
    card?.bank,
    card?.name,
    installment.amount,
  ]);
}

export function matchesCategorySearch(category: FinancialCategory, query: string) {
  const normalized = normalizeSearch(query);
  return containsQuery(normalized, [
    category.name,
    category.parentName,
    category.type,
    category.essentiality,
    ...category.keywords,
  ]);
}
