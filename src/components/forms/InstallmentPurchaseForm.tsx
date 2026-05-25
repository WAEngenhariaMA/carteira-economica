import { useEffect, useState } from "react";
import type { Card, Debt, InstallmentPurchaseInput, InstallmentSource } from "../../types/finance";
import { formatMoney, normalizeMoneyInput } from "../../lib/formatters";

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function defaultSource(cards: Card[]): InstallmentSource {
  return cards.length > 0 ? "card" : "loan";
}

export function InstallmentPurchaseForm({
  cards,
  debts,
  competence,
  onSubmit,
}: {
  cards: Card[];
  debts: Debt[];
  competence: string;
  onSubmit: (purchase: InstallmentPurchaseInput) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    source: defaultSource(cards),
    cardId: cards[0]?.id ?? "",
    creditor: debts[0]?.creditor ?? "",
    description: "",
    category: cards.length > 0 ? "Compras parceladas" : "Empréstimos",
    purchaseDate: `${competence}-01`,
    totalAmount: "",
    downPayment: "0.00",
    totalInstallments: "2",
    firstCompetence: competence,
  });

  useEffect(() => {
    setForm((current) => ({
      ...current,
      cardId: current.cardId || cards[0]?.id || "",
      source: current.source === "card" && cards.length === 0 ? "loan" : current.source,
      creditor: current.creditor || debts[0]?.creditor || "",
    }));
  }, [cards, debts]);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      purchaseDate: `${competence}-01`,
      firstCompetence: competence,
    }));
  }, [competence]);

  const totalAmount = toNumber(form.totalAmount);
  const downPayment = toNumber(form.downPayment);
  const totalInstallments = Math.max(1, Math.floor(toNumber(form.totalInstallments)));
  const financedAmount = Math.max(totalAmount - downPayment, 0);
  const installmentAmount = totalInstallments > 0 ? financedAmount / totalInstallments : 0;
  const isLoan = form.source === "loan";
  const submitDisabled = saving
    || downPayment >= totalAmount
    || (form.source === "card" && !form.cardId)
    || (isLoan && !form.creditor.trim());

  function handleSourceChange(source: InstallmentSource) {
    setForm((current) => ({
      ...current,
      source,
      category: source === "loan" ? "Empréstimos" : "Compras parceladas",
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");

    try {
      await onSubmit({
        source: form.source as InstallmentSource,
        cardId: form.source === "card" ? form.cardId : undefined,
        creditor: form.source === "loan" ? form.creditor.trim() : undefined,
        description: form.description.trim(),
        category: form.category.trim() || (form.source === "loan" ? "Empréstimos" : "Compras parceladas"),
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
        downPayment: "0.00",
        totalInstallments: "2",
      }));
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Não foi possível cadastrar o parcelamento.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="entry-form installment-form" onSubmit={handleSubmit}>
      <label>
        Origem do parcelamento
        <select value={form.source} onChange={(event) => handleSourceChange(event.target.value as InstallmentSource)}>
          <option value="card" disabled={cards.length === 0}>Cartão</option>
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
          <input
            value={form.creditor}
            list="debt-creditors"
            placeholder="Ex.: Banco, financeira, pessoa física"
            onChange={(event) => setForm({ ...form, creditor: event.target.value })}
            required
          />
          <datalist id="debt-creditors">
            {debts.map((debt) => <option key={debt.id} value={debt.creditor} />)}
          </datalist>
        </label>
      )}

      <label>
        Descrição
        <input
          value={form.description}
          placeholder={isLoan ? "Ex.: Empréstimo pessoal, renegociação" : "Ex.: Notebook, pneus, viagem"}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          required
        />
      </label>
      <label>
        Categoria
        <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} required />
      </label>
      <label>
        Data da contratação
        <input value={form.purchaseDate} type="date" onChange={(event) => setForm({ ...form, purchaseDate: event.target.value })} required />
      </label>
      <label>
        Valor total
        <input
          value={form.totalAmount}
          type="number"
          min="0.01"
          step="0.01"
          onBlur={() => setForm({ ...form, totalAmount: normalizeMoneyInput(form.totalAmount) })}
          onChange={(event) => setForm({ ...form, totalAmount: event.target.value })}
          required
        />
      </label>
      <label>
        Entrada
        <input
          value={form.downPayment}
          type="number"
          min="0"
          step="0.01"
          onBlur={() => setForm({ ...form, downPayment: normalizeMoneyInput(form.downPayment) })}
          onChange={(event) => setForm({ ...form, downPayment: event.target.value })}
        />
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
        <span>{isLoan ? "Dívida parcelada" : "Financiado no cartão"}</span>
        <strong>{formatMoney(financedAmount)}</strong>
        <small>{totalInstallments}x de {formatMoney(installmentAmount)}</small>
      </div>
      <button className="primary-button" type="submit" disabled={submitDisabled}>
        {saving ? "Salvando..." : "Cadastrar parcelamento"}
      </button>
      {downPayment >= totalAmount && totalAmount > 0 && <p className="form-error inline-message">Entrada precisa ser menor que o valor total.</p>}
      {form.source === "card" && cards.length === 0 && <p className="form-error inline-message">Cadastre um cartão ou selecione empréstimo.</p>}
      {error && <p className="form-error inline-message">{error}</p>}
      {saved && <p className="form-success inline-message">Parcelamento cadastrado nas competências futuras.</p>}
    </form>
  );
}
