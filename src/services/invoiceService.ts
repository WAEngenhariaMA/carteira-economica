import { getSupabase } from "../lib/supabase";
import type { Invoice } from "../types/finance";
import { shiftCompetence } from "./dateService";
import { invoiceToRow, mapInvoice } from "./mappers";

export const invoiceService = {
  async listByCompetence(userId: string, competence: string) {
    const nextCompetence = shiftCompetence(competence, 1);
    const { data, error } = await getSupabase()
      .from("invoices")
      .select("*")
      .eq("user_id", userId)
      .gte("due_date", `${competence}-01`)
      .lt("due_date", `${nextCompetence}-01`)
      .order("due_date", { ascending: true });

    if (error) throw error;
    return (data ?? []).map(mapInvoice);
  },

  async upsert(userId: string, invoice: Omit<Invoice, "id"> & { id?: string }) {
    const payload = { ...invoiceToRow(invoice), user_id: userId, id: invoice.id };
    const { data, error } = await getSupabase()
      .from("invoices")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();

    if (error) throw error;
    return mapInvoice(data);
  },

  async remove(userId: string, id: string) {
    const { error } = await getSupabase()
      .from("invoices")
      .delete()
      .eq("user_id", userId)
      .eq("id", id);

    if (error) throw error;
  },
};
