import { getSupabase } from "../lib/supabase";
import type { Installment, InstallmentPurchaseInput, Transaction } from "../types/finance";
import { installmentToRow, mapInstallment, transactionToRow } from "./mappers";
import { nextCompetences, shiftCompetence } from "./dateService";

function money(value: number) {
  return Number(value.toFixed(2));
}

function isMissingOptionalInstallmentColumn(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const message = Object.values(error as Record<string, unknown>).join(" ").toLowerCase();

  return message.includes("installment_source") || message.includes("creditor");
}

function isUnsupportedLoanPaymentRail(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const message = Object.values(error as Record<string, unknown>).join(" ").toLowerCase();

  return message.includes("loan") && (message.includes("payment_rail") || message.includes("enum"));
}

function withoutOptionalInstallmentColumns<T extends Record<string, unknown>>(row: T) {
  const { installment_source: _source, creditor: _creditor, ...legacyRow } = row;
  return legacyRow;
}

export const installmentService = {
  async listFuture(userId: string, competence: string, months = 24) {
    const monthKeys = nextCompetences(competence, months);
    const { data, error } = await getSupabase()
      .from("installments")
      .select("*")
      .eq("user_id", userId)
      .in("competence", monthKeys)
      .order("competence", { ascending: true });

    if (error) throw error;
    return (data ?? []).map(mapInstallment);
  },

  async create(userId: string, installment: Omit<Installment, "id">) {
    const client = getSupabase();
    const payload = { ...installmentToRow(installment), user_id: userId };
    const { data, error } = await client
      .from("installments")
      .insert(payload)
      .select("*")
      .single();

    if (error && isMissingOptionalInstallmentColumn(error)) {
      const { data: fallbackData, error: fallbackError } = await client
        .from("installments")
        .insert(withoutOptionalInstallmentColumns(payload))
        .select("*")
        .single();

      if (fallbackError) throw fallbackError;
      return mapInstallment(fallbackData);
    }

    if (error) throw error;
    return mapInstallment(data);
  },

  async update(userId: string, id: string, installment: Partial<Installment>) {
    const client = getSupabase();
    const payload = installmentToRow(installment);
    const { data, error } = await client
      .from("installments")
      .update(payload)
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .single();

    if (error && isMissingOptionalInstallmentColumn(error)) {
      const { data: fallbackData, error: fallbackError } = await client
        .from("installments")
        .update(withoutOptionalInstallmentColumns(payload))
        .eq("user_id", userId)
        .eq("id", id)
        .select("*")
        .single();

      if (fallbackError) throw fallbackError;
      return mapInstallment(fallbackData);
    }

    if (error) throw error;
    return mapInstallment(data);
  },

  async createPurchase(userId: string, purchase: InstallmentPurchaseInput) {
    const totalAmount = money(purchase.totalAmount);
    const downPayment = money(purchase.downPayment);
    const financedAmount = money(totalAmount - downPayment);
    const source = purchase.source;
    const creditor = purchase.creditor?.trim();
    const category = purchase.category.trim() || (source === "loan" ? "Empréstimos" : "Compras parceladas");

    if (totalAmount <= 0) throw new Error("Informe um valor total maior que zero.");
    if (source === "card" && !purchase.cardId) throw new Error("Selecione o cartão do parcelamento.");
    if (source === "loan" && !creditor) throw new Error("Informe o credor ou instituição do empréstimo.");
    if (downPayment < 0) throw new Error("A entrada não pode ser negativa.");
    if (financedAmount <= 0) throw new Error("A entrada não pode ser maior ou igual ao valor total.");
    if (purchase.totalInstallments < 1) throw new Error("Informe pelo menos uma parcela.");

    const client = getSupabase();
    const baseInstallmentAmount = money(financedAmount / purchase.totalInstallments);
    const rows = Array.from({ length: purchase.totalInstallments }, (_, index) => {
      const competence = shiftCompetence(purchase.firstCompetence, index);
      const remainder = money(financedAmount - baseInstallmentAmount * purchase.totalInstallments);
      const amount = index === purchase.totalInstallments - 1
        ? money(baseInstallmentAmount + remainder)
        : baseInstallmentAmount;

      return {
        ...installmentToRow({
          cardId: source === "card" ? purchase.cardId : undefined,
          source,
          creditor: source === "loan" ? creditor : undefined,
          description: purchase.description,
          category,
          purchaseDate: purchase.purchaseDate,
          totalAmount,
          downPayment,
          competence,
          installmentNumber: index + 1,
          totalInstallments: purchase.totalInstallments,
          amount,
          status: index === 0 ? "open" : "scheduled",
        }),
        user_id: userId,
      };
    });

    let { data, error } = await client
      .from("installments")
      .insert(rows)
      .select("*");

    if (error && isMissingOptionalInstallmentColumn(error)) {
      const fallback = await client
        .from("installments")
        .insert(rows.map(withoutOptionalInstallmentColumns))
        .select("*");

      data = fallback.data;
      error = fallback.error;
    }

    if (error) throw error;

    if (downPayment > 0) {
      const downPaymentTransaction: Omit<Transaction, "id"> = {
        date: purchase.purchaseDate,
        competence: purchase.purchaseDate.slice(0, 7),
        description: `${purchase.description} - entrada`,
        amount: downPayment,
        type: "expense",
        category,
        subcategory: "Entrada",
        essentiality: "important",
        recurring: false,
        fixed: false,
        paymentRail: source === "card" ? "card" : "loan",
        bank: source === "loan" ? creditor ?? "" : "",
        cardId: source === "card" ? purchase.cardId : undefined,
        status: "open",
        priority: "adjustable",
        impact: "medium",
        notes: `Entrada de ${downPayment} em parcelamento de ${totalAmount}.`,
      };

      let { data: transactionData, error: transactionError } = await client
        .from("transactions")
        .insert({ ...transactionToRow(downPaymentTransaction), user_id: userId })
        .select("id")
        .single();

      if (transactionError && source === "loan" && isUnsupportedLoanPaymentRail(transactionError)) {
        const fallbackTransaction: Omit<Transaction, "id"> = {
          ...downPaymentTransaction,
          paymentRail: "bank",
          notes: `${downPaymentTransaction.notes} Origem real: empréstimo.`,
        };
        const fallback = await client
          .from("transactions")
          .insert({ ...transactionToRow(fallbackTransaction), user_id: userId })
          .select("id")
          .single();

        transactionData = fallback.data;
        transactionError = fallback.error;
      }

      if (transactionError) throw transactionError;
      if (!transactionData?.id) throw new Error("Não foi possível registrar a entrada.");
    }

    return (data ?? [])
      .map(mapInstallment)
      .sort((a, b) => a.competence.localeCompare(b.competence) || a.installmentNumber - b.installmentNumber);
  },

  async remove(userId: string, id: string) {
    const { error } = await getSupabase()
      .from("installments")
      .delete()
      .eq("user_id", userId)
      .eq("id", id);

    if (error) throw error;
  },
};
