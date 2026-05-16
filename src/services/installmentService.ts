import { getSupabase } from "../lib/supabase";
import type { Installment } from "../types/finance";
import { installmentToRow, mapInstallment } from "./mappers";
import { nextCompetences } from "./dateService";

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

  async remove(userId: string, id: string) {
    const { error } = await getSupabase()
      .from("installments")
      .delete()
      .eq("user_id", userId)
      .eq("id", id);

    if (error) throw error;
  },
};
