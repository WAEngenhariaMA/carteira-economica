import { useEffect, useState } from "react";
import type { Card, Installment } from "../../types/finance";

export function InstallmentEditForm({
  cards,
  installment,
  onSubmit,
  onCancel,
}: {
  cards: Card[];
  installment: Installment;
  onSubmit: (installment: Partial<Installment>) => Promise<void>;
  onCancel: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    cardId: installment.cardId ?? "",
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
      cardId: installment.cardId ?? "",
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
        cardId: form.cardId || undefined,
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
        Cartao
        <select value={form.cardId} onChange={(event) => setForm({ ...form, cardId: event.target.value })} required>
          {cards.map((card) => <option key={card.id} value={card.id}>{card.bank} - {card.name}</option>)}
        </select>
      </label>
      <label>
        Descricao
        <input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
      </label>
      <label>
        Categoria
        <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
      </label>
      <label>
        Data da compra
        <input value={form.purchaseDate} type="date" onChange={(event) => setForm({ ...form, purchaseDate: event.target.value })} />
      </label>
      <label>
        Competencia
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
          Cancelar edicao
        </button>
      </div>
    </form>
  );
}
