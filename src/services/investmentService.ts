import { getSupabase } from "../lib/supabase";
import type { Investment } from "../types/finance";
import { mapInvestment } from "./mappers";

export const investmentService = {
  async list(userId: string) {
    const { data, error } = await getSupabase()
      .from("investments")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []).map(mapInvestment);
  },

  async create(userId: string, investment: Omit<Investment, "id">) {
    const { data, error } = await getSupabase()
      .from("investments")
      .insert({
        user_id: userId,
        name: investment.name,
        investment_type: investment.type,
        amount: investment.amount,
        liquidity_days: investment.liquidityDays,
      })
      .select("*")
      .single();

    if (error) throw error;
    return mapInvestment(data);
  },
};
