import { getSupabase } from "../lib/supabase";
import type { Debt } from "../types/finance";
import { mapDebt } from "./mappers";

export const debtService = {
  async list(userId: string) {
    const { data, error } = await getSupabase()
      .from("debts")
      .select("*")
      .eq("user_id", userId)
      .order("interest_rate_month", { ascending: false });

    if (error) throw error;
    return (data ?? []).map(mapDebt);
  },

  async create(userId: string, debt: Omit<Debt, "id">) {
    const { data, error } = await getSupabase()
      .from("debts")
      .insert({
        user_id: userId,
        creditor: debt.creditor,
        debt_type: debt.type,
        balance: debt.balance,
        monthly_payment: debt.monthlyPayment,
        interest_rate_month: debt.interestRateMonth,
        months_left: debt.monthsLeft,
        renegotiable: debt.renegotiable,
      })
      .select("*")
      .single();

    if (error) throw error;
    return mapDebt(data);
  },
};
