import { getSupabase } from "../lib/supabase";
import type { Card } from "../types/finance";
import { mapCard, cardToRow } from "./mappers";
import { nextCompetences, previousCompetence } from "./dateService";

export const cardService = {
  async listWithMetrics(userId: string, competence: string) {
    const futureMonths = nextCompetences(competence, 6);
    const metricMonths = [previousCompetence(competence), ...futureMonths];
    const { data: cardRows, error: cardError } = await getSupabase()
      .from("cards")
      .select("*")
      .eq("user_id", userId)
      .eq("active", true)
      .order("bank", { ascending: true });

    if (cardError) throw cardError;

    const cardIds = (cardRows ?? []).map((card) => card.id);
    if (cardIds.length === 0) return [];

    const [{ data: invoices, error: invoiceError }, { data: installments, error: installmentError }] =
      await Promise.all([
        getSupabase()
          .from("invoices")
          .select("*")
          .eq("user_id", userId)
          .in("card_id", cardIds)
          .in("competence", [competence, previousCompetence(competence)]),
        getSupabase()
          .from("installments")
          .select("*")
          .eq("user_id", userId)
          .in("card_id", cardIds)
          .in("competence", metricMonths),
      ]);

    if (invoiceError) throw invoiceError;
    if (installmentError) throw installmentError;

    return (cardRows ?? []).map((cardRow) => {
      const currentInvoice = (invoices ?? []).find(
        (invoice) => invoice.card_id === cardRow.id && invoice.competence === competence,
      );
      const previousInvoice = (invoices ?? []).find(
        (invoice) => invoice.card_id === cardRow.id && invoice.competence === previousCompetence(competence),
      );
      const previousInstallments = (installments ?? [])
        .filter((installment) => installment.card_id === cardRow.id && installment.competence === previousCompetence(competence))
        .reduce((total, installment) => total + Number(installment.amount ?? 0), 0);
      const futureInstallments = futureMonths.map((month) =>
        (installments ?? [])
          .filter(
            (installment) =>
              installment.card_id === cardRow.id
              && installment.competence === month
              && (month === competence || installment.status !== "paid"),
          )
          .reduce((total, installment) => total + Number(installment.amount ?? 0), 0),
      );
      const currentInstallments = futureInstallments[0] ?? 0;
      const currentInvoiceAmount = Number(currentInvoice?.total_amount ?? 0);
      const previousInvoiceAmount = Number(previousInvoice?.total_amount ?? 0);

      return mapCard(
        cardRow,
        currentInvoiceAmount > 0 ? currentInvoiceAmount : currentInstallments,
        previousInvoiceAmount > 0 ? previousInvoiceAmount : previousInstallments,
        futureInstallments,
      );
    });
  },

  async create(userId: string, card: Omit<Card, "id" | "currentInvoice" | "previousInvoice" | "futureInstallments">) {
    const { data, error } = await getSupabase()
      .from("cards")
      .insert({ ...cardToRow(card), user_id: userId })
      .select("*")
      .single();

    if (error) throw error;
    return mapCard(data);
  },

  async update(userId: string, id: string, card: Partial<Card>) {
    const { data, error } = await getSupabase()
      .from("cards")
      .update(cardToRow(card))
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return mapCard(data);
  },

  async remove(userId: string, id: string) {
    const { error } = await getSupabase()
      .from("cards")
      .update({ active: false })
      .eq("user_id", userId)
      .eq("id", id);

    if (error) throw error;
  },
};
