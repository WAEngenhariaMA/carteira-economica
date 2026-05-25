import { getSupabase } from "../lib/supabase";
import { transactionBelongsToCompetence } from "../lib/financeEngine";
import type { Transaction } from "../types/finance";
import { mapTransaction, transactionToRow } from "./mappers";
import { sameDayInCompetence } from "./dateService";

function projectRecurringTransaction(transaction: Transaction, competence: string): Transaction {
  if (transaction.competence === competence) return transaction;

  return {
    ...transaction,
    date: sameDayInCompetence(transaction.date, competence),
    competence,
    status: transaction.status === "paid" ? "scheduled" : transaction.status,
    sourceDate: transaction.sourceDate ?? transaction.date,
    sourceCompetence: transaction.sourceCompetence ?? transaction.competence,
    projectedFromRecurring: true,
  };
}

function sortTransactionsByDateDesc(a: Transaction, b: Transaction) {
  return b.date.localeCompare(a.date) || a.description.localeCompare(b.description);
}

function transactionSignature(transaction: Transaction) {
  return [
    transaction.type,
    transaction.description.trim().toLowerCase(),
    transaction.category.trim().toLowerCase(),
    transaction.subcategory.trim().toLowerCase(),
    transaction.paymentRail,
    transaction.amount.toFixed(2),
  ].join("|");
}

export const transactionService = {
  async listByCompetence(userId: string, competence: string) {
    const client = getSupabase();
    const [{ data: currentRows, error: currentError }, { data: recurringRows, error: recurringError }] =
      await Promise.all([
        client
          .from("transactions")
          .select("*")
          .eq("user_id", userId)
          .eq("competence", competence),
        client
          .from("transactions")
          .select("*")
          .eq("user_id", userId)
          .lt("competence", competence)
          .or("recurring.eq.true,fixed.eq.true"),
      ]);

    if (currentError) throw currentError;
    if (recurringError) throw recurringError;

    const currentTransactions = (currentRows ?? [])
      .map(mapTransaction)
      .filter((transaction) => transactionBelongsToCompetence(transaction, competence));
    const currentSignatures = new Set(currentTransactions.map(transactionSignature));
    const projectedRecurringTransactions = (recurringRows ?? [])
      .map(mapTransaction)
      .map((transaction) => projectRecurringTransaction(transaction, competence))
      .filter((transaction) => !currentSignatures.has(transactionSignature(transaction)));

    return [...projectedRecurringTransactions, ...currentTransactions].sort(sortTransactionsByDateDesc);
  },

  async listRange(userId: string, fromCompetence: string, toCompetence: string) {
    const { data, error } = await getSupabase()
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .gte("competence", fromCompetence)
      .lte("competence", toCompetence)
      .order("competence", { ascending: true });

    if (error) throw error;
    return (data ?? []).map(mapTransaction);
  },

  async create(userId: string, transaction: Omit<Transaction, "id">) {
    const { data, error } = await getSupabase()
      .from("transactions")
      .insert({ ...transactionToRow(transaction), user_id: userId })
      .select("*")
      .single();

    if (error) throw error;
    return mapTransaction(data);
  },

  async update(userId: string, id: string, transaction: Partial<Transaction>) {
    const { data, error } = await getSupabase()
      .from("transactions")
      .update(transactionToRow(transaction))
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return mapTransaction(data);
  },

  async remove(userId: string, id: string) {
    const { error } = await getSupabase()
      .from("transactions")
      .delete()
      .eq("user_id", userId)
      .eq("id", id);

    if (error) throw error;
  },
};
