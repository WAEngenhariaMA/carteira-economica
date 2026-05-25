import { useEffect, useState } from "react";
import { formatNumberInput, normalizeMoneyInput } from "../../lib/formatters";
import type { Card } from "../../types/finance";

export function CardForm({
  onSubmit,
  initialValue,
  onCancel,
}: {
  onSubmit: (card: Omit<Card, "id" | "currentInvoice" | "previousInvoice" | "futureInstallments">) => Promise<void>;
  initialValue?: Card | null;
  onCancel?: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => ({
    bank: initialValue?.bank ?? "",
    name: initialValue?.name ?? "",
    limit: initialValue ? formatNumberInput(initialValue.limit) : "",
    dueDay: initialValue ? String(initialValue.dueDay) : "10",
    closingDay: initialValue ? String(initialValue.closingDay) : "3",
    interestRateMonth: initialValue ? String(initialValue.interestRateMonth) : "12.5",
  }));

  useEffect(() => {
    setForm({
      bank: initialValue?.bank ?? "",
      name: initialValue?.name ?? "",
      limit: initialValue ? formatNumberInput(initialValue.limit) : "",
      dueDay: initialValue ? String(initialValue.dueDay) : "10",
      closingDay: initialValue ? String(initialValue.closingDay) : "3",
      interestRateMonth: initialValue ? String(initialValue.interestRateMonth) : "12.5",
    });
  }, [initialValue]);

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
      if (!initialValue) {
        setForm({ bank: "", name: "", limit: "", dueDay: "10", closingDay: "3", interestRateMonth: "12.5" });
      }
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
        Nome do cartão
        <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
      </label>
      <label>
        Limite
        <input
          value={form.limit}
          type="number"
          min="0"
          step="0.01"
          onBlur={() => setForm({ ...form, limit: normalizeMoneyInput(form.limit) })}
          onChange={(event) => setForm({ ...form, limit: event.target.value })}
          required
        />
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
      <div className="form-actions">
        <button className="primary-button" type="submit" disabled={saving}>
          {saving ? "Salvando..." : initialValue ? "Atualizar cartão" : "Cadastrar cartão"}
        </button>
        {initialValue && onCancel && (
          <button className="ghost-button" type="button" onClick={onCancel}>
            Cancelar edição
          </button>
        )}
      </div>
    </form>
  );
}
