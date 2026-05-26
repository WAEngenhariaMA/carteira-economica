import { useState } from "react";
import { normalizeMoneyInput } from "../../lib/formatters";
import type { FinancialProfile } from "../../types/finance";

function optionalMoney(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function ProfileSetupForm({ onSubmit }: { onSubmit: (profile: Omit<FinancialProfile, "id">) => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    ownerName: "",
    householdName: "Minha carteira",
    monthlyIncomeTarget: "",
    currentReserve: "0.00",
    reserveTarget: "",
    idealIncome: "",
    riskTolerance: "medium",
    preferredRule: "70-10-20",
    currentSituation: "reorganizing",
    mainObjective: "organize_spending",
    reserveMonthsDesired: "6",
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        ownerName: form.ownerName,
        householdName: form.householdName,
        monthlyIncomeTarget: optionalMoney(form.monthlyIncomeTarget),
        currentReserve: optionalMoney(form.currentReserve),
        reserveTarget: optionalMoney(form.reserveTarget),
        idealIncome: optionalMoney(form.idealIncome),
        riskTolerance: form.riskTolerance as FinancialProfile["riskTolerance"],
        preferredRule: form.preferredRule as FinancialProfile["preferredRule"],
        currentSituation: form.currentSituation as FinancialProfile["currentSituation"],
        mainObjective: form.mainObjective as FinancialProfile["mainObjective"],
        reserveMonthsDesired: Number(form.reserveMonthsDesired) as FinancialProfile["reserveMonthsDesired"],
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="profile-form" onSubmit={handleSubmit}>
      <label>
        Nome
        <input value={form.ownerName} onChange={(event) => setForm({ ...form, ownerName: event.target.value })} required />
      </label>
      <label>
        Nome da carteira
        <input value={form.householdName} onChange={(event) => setForm({ ...form, householdName: event.target.value })} required />
      </label>
      <label>
        Renda alvo mensal
        <input
          value={form.monthlyIncomeTarget}
          type="number"
          min="0"
          step="0.01"
          placeholder="Opcional"
          onBlur={() => setForm({ ...form, monthlyIncomeTarget: normalizeMoneyInput(form.monthlyIncomeTarget) })}
          onChange={(event) => setForm({ ...form, monthlyIncomeTarget: event.target.value })}
        />
      </label>
      <label>
        Reserva atual
        <input
          value={form.currentReserve}
          type="number"
          min="0"
          step="0.01"
          placeholder="Opcional"
          onBlur={() => setForm({ ...form, currentReserve: normalizeMoneyInput(form.currentReserve) })}
          onChange={(event) => setForm({ ...form, currentReserve: event.target.value })}
        />
      </label>
      <label>
        Meta de reserva
        <input
          value={form.reserveTarget}
          type="number"
          min="0"
          step="0.01"
          placeholder="Opcional"
          onBlur={() => setForm({ ...form, reserveTarget: normalizeMoneyInput(form.reserveTarget) })}
          onChange={(event) => setForm({ ...form, reserveTarget: event.target.value })}
        />
      </label>
      <label>
        Renda ideal
        <input
          value={form.idealIncome}
          type="number"
          min="0"
          step="0.01"
          placeholder="Opcional"
          onBlur={() => setForm({ ...form, idealIncome: normalizeMoneyInput(form.idealIncome) })}
          onChange={(event) => setForm({ ...form, idealIncome: event.target.value })}
        />
      </label>
      <label>
        Situação atual
        <select
          value={form.currentSituation}
          onChange={(event) => setForm({ ...form, currentSituation: event.target.value })}
        >
          <option value="healthy">Saudável</option>
          <option value="tight">Apertado</option>
          <option value="indebted">Endividado</option>
          <option value="reorganizing">Reorganizando</option>
          <option value="investing">Investindo</option>
        </select>
      </label>
      <label>
        Objetivo principal
        <select
          value={form.mainObjective}
          onChange={(event) => setForm({ ...form, mainObjective: event.target.value })}
        >
          <option value="pay_debts">Quitar dívidas</option>
          <option value="organize_spending">Organizar gastos</option>
          <option value="build_reserve">Criar reserva</option>
          <option value="invest">Investir</option>
          <option value="buy_asset">Comprar algo</option>
          <option value="reduce_cards">Reduzir cartão</option>
        </select>
      </label>
      <label>
        Meses de reserva desejados
        <select
          value={form.reserveMonthsDesired}
          onChange={(event) => setForm({ ...form, reserveMonthsDesired: event.target.value })}
        >
          <option value="3">3 meses</option>
          <option value="6">6 meses</option>
          <option value="12">12 meses</option>
        </select>
      </label>
      <p className="form-success inline-message">
        Deixe renda alvo, meta de reserva e renda ideal em branco para o sistema calcular automaticamente depois.
      </p>
      <button className="primary-button" type="submit" disabled={saving}>
        {saving ? "Criando..." : "Criar perfil financeiro"}
      </button>
    </form>
  );
}
