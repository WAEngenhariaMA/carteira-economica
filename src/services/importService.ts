import { getSupabase } from "../lib/supabase";
import type { DataQualityIssue, FinancialCategory, Transaction } from "../types/finance";
import type { ImportPreview } from "../lib/importer";
import { transactionService } from "./transactionService";

export interface ValidatedImportRow {
  rowIndex: number;
  transaction: Omit<Transaction, "id">;
  issues: DataQualityIssue[];
  duplicate: boolean;
}

function readCell(row: Record<string, unknown>, column?: string) {
  if (!column) return "";
  return String(row[column] ?? "").trim();
}

function parseAmount(value: string) {
  const normalized = value.replace(/[R$\s.]/g, "").replace(",", ".");
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : 0;
}

function normalizeDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  return "";
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function inferCategory(description: string, rawCategory: string, categories: FinancialCategory[]) {
  const normalizedDescription = normalizeText(`${description} ${rawCategory}`);
  const activeCategories = categories.filter((category) => category.isActive);
  const match = activeCategories.find((category) =>
    category.keywords.some((keyword) => normalizedDescription.includes(normalizeText(keyword))),
  );

  if (!match) {
    return {
      category: rawCategory || "Sem categoria",
      subcategory: "",
      essentiality: "important" as Transaction["essentiality"],
    };
  }

  const parent = match.parentId
    ? activeCategories.find((category) => category.id === match.parentId)
    : match;

  return {
    category: parent?.name ?? match.name,
    subcategory: match.parentId ? match.name : "",
    essentiality: match.essentiality,
  };
}

export function validateImportPreview(
  preview: ImportPreview,
  mapping: Record<string, string>,
  existing: Transaction[],
  categories: FinancialCategory[] = [],
): ValidatedImportRow[] {
  const duplicates = new Set(
    existing.map((item) => `${item.date}|${item.description.toLowerCase()}|${item.amount}`),
  );

  return preview.rows.map((row, index) => {
    const date = normalizeDate(readCell(row, mapping.date));
    const description = readCell(row, mapping.description);
    const amount = parseAmount(readCell(row, mapping.amount));
    const rawCategory = readCell(row, mapping.category);
    const bank = readCell(row, mapping.bank);
    const card = readCell(row, mapping.card);
    const competence = readCell(row, mapping.competence) || date.slice(0, 7);
    const inferred = inferCategory(description, rawCategory, categories);
    const category = inferred.category;
    const issues: DataQualityIssue[] = [];

    if (!date) issues.push({ rowIndex: index + 1, field: "date", message: "Data inválida ou ausente", severity: "error" });
    if (!description) issues.push({ rowIndex: index + 1, field: "description", message: "Descrição ausente", severity: "error" });
    if (amount === 0) issues.push({ rowIndex: index + 1, field: "amount", message: "Valor zerado ou inválido", severity: "error" });
    if (category === "Sem categoria") {
      issues.push({ rowIndex: index + 1, field: "category", message: "Categoria não informada", severity: "warning" });
    }

    const transaction: Omit<Transaction, "id"> = {
      date,
      competence,
      description,
      amount: Math.abs(amount),
      type: amount < 0 ? "expense" : category.toLowerCase().includes("renda") ? "income" : "expense",
      category,
      subcategory: inferred.subcategory,
      essentiality: inferred.essentiality,
      recurring: false,
      fixed: false,
      paymentRail: card ? "card" : "bank",
      bank,
      status: "open",
      priority: "adjustable",
      impact: Math.abs(amount) > 1000 ? "high" : "medium",
      notes: `Importado de ${preview.fileName}`,
    };

    return {
      rowIndex: index + 1,
      transaction,
      issues,
      duplicate: duplicates.has(`${date}|${description.toLowerCase()}|${Math.abs(amount)}`),
    };
  });
}

export const importService = {
  async createBatch(userId: string, preview: ImportPreview, sourceType: "csv" | "xlsx", mapping: Record<string, string>) {
    const { data, error } = await getSupabase()
      .from("import_batches")
      .insert({
        user_id: userId,
        file_name: preview.fileName,
        source_type: sourceType,
        column_mapping: mapping,
        status: "pending_validation",
        rows_total: preview.rows.length,
        rows_imported: 0,
      })
      .select("*")
      .single();

    if (error) throw error;
    return data;
  },

  async persistValidated(userId: string, batchId: string, rows: ValidatedImportRow[]) {
    const validRows = rows.filter((row) => row.issues.every((issue) => issue.severity !== "error") && !row.duplicate);
    const imported = [];

    for (const row of validRows) {
      imported.push(await transactionService.create(userId, row.transaction));
    }

    const { error } = await getSupabase()
      .from("import_batches")
      .update({ status: "imported", rows_imported: imported.length })
      .eq("user_id", userId)
      .eq("id", batchId);

    if (error) throw error;
    return imported;
  },
};
