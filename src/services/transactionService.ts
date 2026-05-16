import { getSupabase } from "../lib/supabase";
import type { Transaction } from "../types/finance";
import { mapTransaction, transactionToRow } from "./mappers";

export const transactionService = {
  async listByCompetence(userId: string, competence: string) {
    const { data, error } = await getSupabase()
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .eq("competence", competence)
      .order("transaction_date", { ascending: false });

    if (error) throw error;
    return (data ?? []).map(mapTransaction);
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
