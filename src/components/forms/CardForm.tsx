import { useState } from "react";
import type { Card } from "../../types/finance";

export function CardForm({
  onSubmit,
}: {
  onSubmit: (card: Omit<Card, "id" | "currentInvoice" | "previousInvoice" | "futureInstallments">) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    bank: "",
    name: "",
    limit: "",
    dueDay: "10",
    closingDay: "3",
    interestRateMonth: "12.5",
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        bank: form.bank,
        name: form.name,
        limit: Number(form.limit),
        dueDay: Number(form.dueDay),
        closingDay: Number(form.closingDay),
        interestRateMonth: Number(form.interestRateMonth),
      });
      setForm({ bank: "", name: "", limit: "", dueDay: "10", closingDay: "3", interestRateMonth: "12.5" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="entry-form" onSubmit={handleSubmit}>
      <label>
        Banco
        <input value={form.bank} onChange={(event) => setForm({ ...form, bank: event.target.value })} required />
      </label>
      <label>
        Nome do cartao
        <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
      </label>
      <label>
        Limite
        <input value={form.limit} type="number" min="0" step="0.01" onChange={(event) => setForm({ ...form, limit: event.target.value })} required />
      </label>
      <label>
        Vencimento
        <input value={form.dueDay} type="number" min="1" max="31" onChange={(event) => setForm({ ...form, dueDay: event.target.value })} required />
      </label>
      <label>
        Fechamento
        <input value={form.closingDay} type="number" min="1" max="31" onChange={(event) => setForm({ ...form, closingDay: event.target.value })} required />
      </label>
      <label>
        Juros a.m. %
        <input value={form.interestRateMonth} type="number" min="0" step="0.1" onChange={(event) => setForm({ ...form, interestRateMonth: event.target.value })} />
      </label>
      <button className="primary-button" type="submit" disabled={saving}>
        {saving ? "Salvando..." : "Cadastrar cartao"}
      </button>
    </form>
  );
}
