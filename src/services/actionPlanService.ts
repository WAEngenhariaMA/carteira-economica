import { getSupabase } from "../lib/supabase";
import type { ActionItem } from "../types/finance";
import { actionToRow, mapAction } from "./mappers";

export const actionPlanService = {
  async list(userId: string) {
    const { data, error } = await getSupabase()
      .from("action_plans")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []).map(mapAction);
  },

  async create(userId: string, action: Omit<ActionItem, "id">) {
    const { data, error } = await getSupabase()
      .from("action_plans")
      .insert({ ...actionToRow(action), user_id: userId })
      .select("*")
      .single();

    if (error) throw error;
    return mapAction(data);
  },

  async update(userId: string, id: string, action: Partial<ActionItem>) {
    const { data, error } = await getSupabase()
      .from("action_plans")
      .update(actionToRow(action))
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return mapAction(data);
  },

  async remove(userId: string, id: string) {
    const { error } = await getSupabase()
      .from("action_plans")
      .delete()
      .eq("user_id", userId)
      .eq("id", id);

    if (error) throw error;
  },
};
