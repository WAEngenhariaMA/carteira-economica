import { getSupabase } from "../lib/supabase";
import type { Installment, InstallmentPurchaseInput, Transaction } from "../types/finance";
import { installmentToRow, mapInstallment, transactionToRow } from "./mappers";
import { nextCompetences, shiftCompetence } from "./dateService";

function money(value: number) {
  return Number(value.toFixed(2));
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
    const { data, error } = await getSupabase()
      .from("installments")
      .insert({ ...installmentToRow(installment), user_id: userId })
      .select("*")
      .single();

    if (error) throw error;
    return mapInstallment(data);
  },

  async update(userId: string, id: string, installment: Partial<Installment>) {
    const { data, error } = await getSupabase()
      .from("installments")
      .update(installmentToRow(installment))
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return mapInstallment(data);
  },

  async createPurchase(userId: string, purchase: InstallmentPurchaseInput) {
    const totalAmount = money(purchase.totalAmount);
    const downPayment = money(purchase.downPayment);
    const financedAmount = money(totalAmount - downPayment);

    if (totalAmount <= 0) throw new Error("Informe um valor total maior que zero.");
    if (downPayment < 0) throw new Error("A entrada nao pode ser negativa.");
    if (financedAmount <= 0) throw new Error("A entrada nao pode ser maior ou igual ao valor total.");
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
          cardId: purchase.cardId,
          description: purchase.description,
          category: purchase.category,
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

    const { data, error } = await client
      .from("installments")
      .insert(rows)
      .select("*");

    if (error) throw error;

    if (downPayment > 0) {
      const downPaymentTransaction: Omit<Transaction, "id"> = {
        date: purchase.purchaseDate,
        competence: purchase.purchaseDate.slice(0, 7),
        description: `${purchase.description} - entrada`,
        amount: downPayment,
        type: "expense",
        category: purchase.category,
        subcategory: "Entrada",
        essentiality: "important",
        recurring: false,
        fixed: false,
        paymentRail: "card",
        bank: "",
        cardId: purchase.cardId,
        status: "open",
        priority: "adjustable",
        impact: "medium",
        notes: `Entrada de ${downPayment} em compra parcelada de ${totalAmount}.`,
      };

      const { data: transactionData, error: transactionError } = await client
        .from("transactions")
        .insert({ ...transactionToRow(downPaymentTransaction), user_id: userId })
        .select("id")
        .single();

      if (transactionError) throw transactionError;
      if (!transactionData?.id) throw new Error("Nao foi possivel registrar a entrada.");
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
