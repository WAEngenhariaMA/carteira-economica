import { getSupabase } from "../lib/supabase";
import type { Goal } from "../types/finance";
import { mapGoal } from "./mappers";

export const goalService = {
  async list(userId: string) {
    const { data, error } = await getSupabase()
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .order("deadline", { ascending: true });

    if (error) throw error;
    return (data ?? []).map(mapGoal);
  },

  async create(userId: string, goal: Omit<Goal, "id">) {
    const { data, error } = await getSupabase()
      .from("goals")
      .insert({
        user_id: userId,
        name: goal.name,
        target: goal.target,
        current: goal.current,
        deadline: goal.deadline,
        priority: goal.priority,
      })
      .select("*")
      .single();

    if (error) throw error;
    return mapGoal(data);
  },

  async remove(userId: string, id: string) {
    const { error } = await getSupabase().from("goals").delete().eq("user_id", userId).eq("id", id);
    if (error) throw error;
  },
};
