import { useState } from "react";
import { formatNumberInput, normalizeMoneyInput } from "../../lib/formatters";
import type { FinancialProfile } from "../../types/finance";

function moneyInput(value: number) {
  return value > 0 ? formatNumberInput(value) : "";
}

function optionalMoney(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function ProfileFinancialSettingsForm({
  profile,
  onSubmit,
}: {
  profile: FinancialProfile;
  onSubmit: (profile: Partial<FinancialProfile>) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<{
    monthlyIncomeTarget: string;
    currentReserve: string;
    reserveTarget: string;
    idealIncome: string;
    riskTolerance: FinancialProfile["riskTolerance"];
    preferredRule: FinancialProfile["preferredRule"];
  }>({
    monthlyIncomeTarget: moneyInput(profile.monthlyIncomeTarget),
    currentReserve: moneyInput(profile.currentReserve),
    reserveTarget: moneyInput(profile.reserveTarget),
    idealIncome: moneyInput(profile.idealIncome),
    riskTolerance: profile.riskTolerance,
    preferredRule: profile.preferredRule,
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      await onSubmit({
        monthlyIncomeTarget: optionalMoney(form.monthlyIncomeTarget),
        currentReserve: optionalMoney(form.currentReserve),
        reserveTarget: optionalMoney(form.reserveTarget),
        idealIncome: optionalMoney(form.idealIncome),
        riskTolerance: form.riskTolerance as FinancialProfile["riskTolerance"],
        preferredRule: form.preferredRule as FinancialProfile["preferredRule"],
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="entry-form" onSubmit={handleSubmit}>
      <label>
        Renda alvo mensal
        <input
          value={form.monthlyIncomeTarget}
          type="number"
          min="0"
          step="0.01"
          placeholder="Preencher depois"
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
          placeholder="Preencher depois"
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
          placeholder="Preencher depois"
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
          placeholder="Preencher depois"
          onBlur={() => setForm({ ...form, idealIncome: normalizeMoneyInput(form.idealIncome) })}
          onChange={(event) => setForm({ ...form, idealIncome: event.target.value })}
        />
      </label>
      <label>
        Perfil de risco
        <select value={form.riskTolerance} onChange={(event) => setForm({ ...form, riskTolerance: event.target.value as FinancialProfile["riskTolerance"] })}>
          <option value="low">Conservador</option>
          <option value="medium">Moderado</option>
          <option value="high">Agressivo</option>
        </select>
      </label>
      <label>
        Regra preferida
        <select value={form.preferredRule} onChange={(event) => setForm({ ...form, preferredRule: event.target.value as FinancialProfile["preferredRule"] })}>
          <option value="50-30-20">50/30/20</option>
          <option value="60-25-15">60/25/15</option>
          <option value="70-10-20">70/10/20</option>
        </select>
      </label>
      <button className="primary-button" type="submit" disabled={saving}>
        {saving ? "Salvando..." : "Salvar premissas"}
      </button>
      {saved && <p className="form-success inline-message">Premissas financeiras atualizadas.</p>}
    </form>
  );
}
