import { getSupabase } from "../lib/supabase";

export const reportService = {
  async register(userId: string, competence: string, metadata: Record<string, unknown>, storagePath?: string) {
    const { data, error } = await getSupabase()
      .from("generated_reports")
      .insert({
        user_id: userId,
        competence,
        report_type: "executive_pdf",
        storage_path: storagePath ?? null,
        metadata,
      })
      .select("*")
      .single();

    if (error) throw error;
    return data;
  },
};
