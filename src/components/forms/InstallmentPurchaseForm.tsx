import { useState } from "react";
import type { Card, InstallmentPurchaseInput } from "../../types/finance";
import { formatMoney } from "../../lib/formatters";

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function InstallmentPurchaseForm({
  cards,
  competence,
  onSubmit,
}: {
  cards: Card[];
  competence: string;
  onSubmit: (purchase: InstallmentPurchaseInput) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    cardId: cards[0]?.id ?? "",
    description: "",
    category: "Compras parceladas",
    purchaseDate: `${competence}-01`,
    totalAmount: "",
    downPayment: "0",
    totalInstallments: "2",
    firstCompetence: competence,
  });

  const totalAmount = toNumber(form.totalAmount);
  const downPayment = toNumber(form.downPayment);
  const totalInstallments = Math.max(1, Math.floor(toNumber(form.totalInstallments)));
  const financedAmount = Math.max(totalAmount - downPayment, 0);
  const installmentAmount = totalInstallments > 0 ? financedAmount / totalInstallments : 0;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");

    try {
      await onSubmit({
        cardId: form.cardId,
        description: form.description.trim(),
        category: form.category.trim() || "Compras parceladas",
        purchaseDate: form.purchaseDate,
        firstCompetence: form.firstCompetence,
        totalAmount,
        downPayment,
        totalInstallments,
      });
      setSaved(true);
      setForm((current) => ({
        ...current,
        description: "",
        totalAmount: "",
        downPayment: "0",
        totalInstallments: "2",
      }));
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Não foi possível cadastrar o parcelamento.");
    } finally {
      setSaving(false);
    }
  }

  if (cards.length === 0) {
    return (
      <div className="form-empty">
        <strong>Cadastre um cartão primeiro.</strong>
        <span>O parcelamento precisa estar vinculado a um cartão para entrar na projeção futura.</span>
      </div>
    );
  }

  return (
    <form className="entry-form installment-form" onSubmit={handleSubmit}>
      <label>
        Cartão
        <select value={form.cardId} onChange={(event) => setForm({ ...form, cardId: event.target.value })} required>
          {cards.map((card) => <option key={card.id} value={card.id}>{card.bank} - {card.name}</option>)}
        </select>
      </label>
      <label>
        Descrição da compra
        <input value={form.description} placeholder="Ex.: Notebook, pneus, viagem" onChange={(event) => setForm({ ...form, description: event.target.value })} required />
      </label>
      <label>
        Categoria
        <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} required />
      </label>
      <label>
        Data da compra
        <input value={form.purchaseDate} type="date" onChange={(event) => setForm({ ...form, purchaseDate: event.target.value })} required />
      </label>
      <label>
        Valor total
        <input value={form.totalAmount} type="number" min="0.01" step="0.01" onChange={(event) => setForm({ ...form, totalAmount: event.target.value })} required />
      </label>
      <label>
        Entrada
        <input value={form.downPayment} type="number" min="0" step="0.01" onChange={(event) => setForm({ ...form, downPayment: event.target.value })} />
      </label>
      <label>
        Número de parcelas
        <input value={form.totalInstallments} type="number" min="1" step="1" onChange={(event) => setForm({ ...form, totalInstallments: event.target.value })} required />
      </label>
      <label>
        Primeira competência
        <input value={form.firstCompetence} type="month" onChange={(event) => setForm({ ...form, firstCompetence: event.target.value })} required />
      </label>
      <div className="installment-preview">
        <span>Financiado</span>
        <strong>{formatMoney(financedAmount)}</strong>
        <small>{totalInstallments}x de {formatMoney(installmentAmount)}</small>
      </div>
      <button className="primary-button" type="submit" disabled={saving || downPayment >= totalAmount}>
        {saving ? "Salvando..." : "Cadastrar parcelamento"}
      </button>
      {downPayment >= totalAmount && totalAmount > 0 && <p className="form-error inline-message">Entrada precisa ser menor que o valor total.</p>}
      {error && <p className="form-error inline-message">{error}</p>}
      {saved && <p className="form-success inline-message">Parcelamento cadastrado nas competências futuras.</p>}
    </form>
  );
}
