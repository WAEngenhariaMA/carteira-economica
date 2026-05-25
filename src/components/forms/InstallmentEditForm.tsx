import { useEffect, useState } from "react";
import type { Card, Debt, Installment, InstallmentSource } from "../../types/finance";

export function InstallmentEditForm({
  cards,
  debts,
  installment,
  onSubmit,
  onCancel,
}: {
  cards: Card[];
  debts: Debt[];
  installment: Installment;
  onSubmit: (installment: Partial<Installment>) => Promise<void>;
  onCancel: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    source: installment.source,
    cardId: installment.cardId ?? "",
    creditor: installment.creditor ?? "",
    description: installment.description ?? "",
    category: installment.category ?? "",
    purchaseDate: installment.purchaseDate ?? "",
    competence: installment.competence,
    installmentNumber: String(installment.installmentNumber),
    totalInstallments: String(installment.totalInstallments),
    amount: String(installment.amount),
    status: installment.status,
  });

  useEffect(() => {
    setForm({
      source: installment.source,
      cardId: installment.cardId ?? "",
      creditor: installment.creditor ?? "",
      description: installment.description ?? "",
      category: installment.category ?? "",
      purchaseDate: installment.purchaseDate ?? "",
      competence: installment.competence,
      installmentNumber: String(installment.installmentNumber),
      totalInstallments: String(installment.totalInstallments),
      amount: String(installment.amount),
      status: installment.status,
    });
  }, [installment]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    try {
      await onSubmit({
        source: form.source as InstallmentSource,
        cardId: form.source === "card" ? form.cardId || undefined : undefined,
        creditor: form.source === "loan" ? form.creditor.trim() : undefined,
        description: form.description,
        category: form.category,
        purchaseDate: form.purchaseDate || undefined,
        competence: form.competence,
        installmentNumber: Number(form.installmentNumber),
        totalInstallments: Number(form.totalInstallments),
        amount: Number(form.amount),
        status: form.status as Installment["status"],
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="entry-form" onSubmit={handleSubmit}>
      <label>
        Origem
        <select value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value as InstallmentSource })}>
          <option value="card">Cartão</option>
          <option value="loan">Empréstimo</option>
        </select>
      </label>
      {form.source === "card" ? (
        <label>
          Cartão
          <select value={form.cardId} onChange={(event) => setForm({ ...form, cardId: event.target.value })} required>
            {cards.map((card) => <option key={card.id} value={card.id}>{card.bank} - {card.name}</option>)}
          </select>
        </label>
      ) : (
        <label>
          Credor / instituição
          <input value={form.creditor} list="edit-debt-creditors" onChange={(event) => setForm({ ...form, creditor: event.target.value })} required />
          <datalist id="edit-debt-creditors">
            {debts.map((debt) => <option key={debt.id} value={debt.creditor} />)}
          </datalist>
        </label>
      )}
      <label>
        Descrição
        <input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
      </label>
      <label>
        Categoria
        <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
      </label>
      <label>
        Data da contratação
        <input value={form.purchaseDate} type="date" onChange={(event) => setForm({ ...form, purchaseDate: event.target.value })} />
      </label>
      <label>
        Competência
        <input value={form.competence} type="month" onChange={(event) => setForm({ ...form, competence: event.target.value })} required />
      </label>
      <label>
        Parcela
        <input value={form.installmentNumber} type="number" min="1" step="1" onChange={(event) => setForm({ ...form, installmentNumber: event.target.value })} required />
      </label>
      <label>
        Total parcelas
        <input value={form.totalInstallments} type="number" min="1" step="1" onChange={(event) => setForm({ ...form, totalInstallments: event.target.value })} required />
      </label>
      <label>
        Valor
        <input value={form.amount} type="number" min="0.01" step="0.01" onChange={(event) => setForm({ ...form, amount: event.target.value })} required />
      </label>
      <label>
        Status
        <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as Installment["status"] })}>
          <option value="scheduled">Agendada</option>
          <option value="open">Aberta</option>
          <option value="paid">Paga</option>
        </select>
      </label>
      <div className="form-actions">
        <button className="primary-button" type="submit" disabled={saving}>
          {saving ? "Salvando..." : "Atualizar parcela"}
        </button>
        <button className="ghost-button" type="button" onClick={onCancel}>
          Cancelar edição
        </button>
      </div>
    </form>
  );
}
