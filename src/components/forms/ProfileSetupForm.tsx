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
      <button className="primary-button" type="submit" disabled={saving}>
        {saving ? "Criando..." : "Criar perfil financeiro"}
      </button>
    </form>
  );
}
