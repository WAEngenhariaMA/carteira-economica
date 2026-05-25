import { useEffect, useState } from "react";
import { formatNumberInput, normalizeMoneyInput } from "../../lib/formatters";
import type { Essentiality, PaymentRail, Transaction } from "../../types/finance";

interface TransactionFormProps {
  competence: string;
  type: "income" | "expense";
  onSubmit: (transaction: Omit<Transaction, "id">) => Promise<void>;
  initialValue?: Transaction | null;
  onCancel?: () => void;
}

function blankForm(competence: string, type: "income" | "expense", initialValue?: Transaction | null): {
  date: string;
  description: string;
  amount: string;
  category: string;
  subcategory: string;
  bank: string;
  paymentRail: PaymentRail;
  essentiality: Essentiality;
  status: Transaction["status"];
  fixed: boolean;
  recurring: boolean;
} {
  return {
    date: initialValue?.date ?? `${competence}-01`,
    description: initialValue?.description ?? "",
    amount: initialValue ? formatNumberInput(initialValue.amount) : "",
    category: initialValue?.category ?? (type === "income" ? "Renda" : "Sem categoria"),
    subcategory: initialValue?.subcategory ?? "",
    bank: initialValue?.bank ?? "",
    paymentRail: initialValue?.paymentRail ?? ("bank" as const),
    essentiality: initialValue?.essentiality ?? (type === "income" ? "important" : "essential"),
    status: initialValue?.status ?? (type === "income" ? "paid" : "open"),
    fixed: initialValue?.fixed ?? false,
    recurring: initialValue?.recurring ?? false,
  };
}

function statusOptions(type: "income" | "expense") {
  if (type === "income") {
    return [
      { value: "paid", label: "Recebida" },
      { value: "open", label: "A receber" },
      { value: "scheduled", label: "Prevista" },
    ] as const;
  }

  return [
    { value: "paid", label: "Paga" },
    { value: "open", label: "Pendente" },
    { value: "scheduled", label: "Agendada" },
  ] as const;
}

export function TransactionForm({ competence, type, onSubmit, initialValue, onCancel }: TransactionFormProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(blankForm(competence, type, initialValue));
  const editingProjectedRecurring = Boolean(initialValue?.projectedFromRecurring);

  useEffect(() => {
    setForm(blankForm(competence, type, initialValue));
  }, [competence, initialValue, type]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        date: editingProjectedRecurring ? initialValue?.sourceDate ?? form.date : form.date,
        competence: editingProjectedRecurring ? initialValue?.sourceCompetence ?? competence : competence,
        description: form.description,
        amount: Number(form.amount),
        type,
        category: form.category,
        subcategory: form.subcategory,
        essentiality: form.essentiality as Transaction["essentiality"],
        recurring: form.recurring,
        fixed: form.fixed,
        paymentRail: form.paymentRail,
        bank: form.bank,
        status: form.status,
        priority: initialValue?.priority ?? (type === "income" ? "adjustable" : "mandatory"),
        impact: initialValue?.impact ?? (Number(form.amount) > 1000 ? "high" : "medium"),
        cardId: initialValue?.cardId,
        installment: initialValue?.installment,
        totalInstallments: initialValue?.totalInstallments,
        notes: initialValue?.notes,
      });
      if (!initialValue) {
        setForm((current) => ({ ...current, description: "", amount: "", subcategory: "" }));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="entry-form" onSubmit={handleSubmit}>
      <label>
        Data
        <input
          value={form.date}
          type="date"
          disabled={editingProjectedRecurring}
          onChange={(event) => setForm({ ...form, date: event.target.value })}
          required
        />
      </label>
      {editingProjectedRecurring && (
        <p className="form-success inline-message">
          Item recorrente herdado de outra competência. A edição atualiza o cadastro original e mantém a recorrência nos próximos meses.
        </p>
      )}
      <label>
        Descrição
        <input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
      </label>
      <label>
        Valor
        <input
          value={form.amount}
          type="number"
          min="0"
          step="0.01"
          onBlur={() => setForm({ ...form, amount: normalizeMoneyInput(form.amount) })}
          onChange={(event) => setForm({ ...form, amount: event.target.value })}
          required
        />
      </label>
      <label>
        Categoria
        <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} required />
      </label>
      <label>
        Subcategoria
        <input value={form.subcategory} onChange={(event) => setForm({ ...form, subcategory: event.target.value })} />
      </label>
      <label>
        Banco
        <input value={form.bank} onChange={(event) => setForm({ ...form, bank: event.target.value })} />
      </label>
      <label>
        Origem
        <select value={form.paymentRail} onChange={(event) => setForm({ ...form, paymentRail: event.target.value as "bank" | "card" | "cash" | "loan" })}>
          <option value="bank">Banco</option>
          <option value="card">Cartão</option>
          <option value="cash">Dinheiro</option>
          <option value="loan">Dívida</option>
        </select>
      </label>
      <label>
        Essencialidade
        <select value={form.essentiality} onChange={(event) => setForm({ ...form, essentiality: event.target.value as Essentiality })}>
          <option value="essential">Essencial</option>
          <option value="important">Importante</option>
          <option value="superfluous">Supérfluo</option>
          <option value="impulsive">Impulsivo</option>
        </select>
      </label>
      <label>
        Status
        <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as Transaction["status"] })}>
          {statusOptions(type).map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
      <label className="check-line">
        <input checked={form.fixed} type="checkbox" onChange={(event) => setForm({ ...form, fixed: event.target.checked })} />
        Fixo
      </label>
      <label className="check-line">
        <input checked={form.recurring} type="checkbox" onChange={(event) => setForm({ ...form, recurring: event.target.checked })} />
        Recorrente
      </label>
      <div className="form-actions">
        <button className="primary-button" type="submit" disabled={saving}>
          {saving ? "Salvando..." : initialValue ? "Atualizar" : "Salvar"}
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
