import { getSupabase } from "../lib/supabase";
import type { FinancialProfile } from "../types/finance";
import { mapProfile, profileToRow } from "./mappers";

export const profileService = {
  async getCurrent(userId: string) {
    const { data, error } = await getSupabase()
      .from("financial_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return data ? mapProfile(data) : null;
  },

  async create(userId: string, profile: Omit<FinancialProfile, "id">) {
    const { data, error } = await getSupabase()
      .from("financial_profiles")
      .insert({ ...profileToRow(profile), user_id: userId })
      .select("*")
      .single();

    if (error) throw error;
    return mapProfile(data);
  },

  async update(userId: string, id: string, profile: Partial<FinancialProfile>) {
    const { data, error } = await getSupabase()
      .from("financial_profiles")
      .update(profileToRow(profile as Omit<FinancialProfile, "id">))
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return mapProfile(data);
  },
};
