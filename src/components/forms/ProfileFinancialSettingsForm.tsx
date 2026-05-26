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
    ownerName: string;
    householdName: string;
    monthlyIncomeTarget: string;
    currentReserve: string;
    reserveTarget: string;
    idealIncome: string;
    riskTolerance: FinancialProfile["riskTolerance"];
    preferredRule: FinancialProfile["preferredRule"];
    currentSituation: FinancialProfile["currentSituation"];
    mainObjective: FinancialProfile["mainObjective"];
    reserveMonthsDesired: string;
  }>({
    ownerName: profile.ownerName,
    householdName: profile.householdName,
    monthlyIncomeTarget: moneyInput(profile.monthlyIncomeTarget),
    currentReserve: moneyInput(profile.currentReserve),
    reserveTarget: moneyInput(profile.reserveTarget),
    idealIncome: moneyInput(profile.idealIncome),
    riskTolerance: profile.riskTolerance,
    preferredRule: profile.preferredRule,
    currentSituation: profile.currentSituation,
    mainObjective: profile.mainObjective,
    reserveMonthsDesired: String(profile.reserveMonthsDesired),
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      await onSubmit({
        ownerName: form.ownerName.trim(),
        householdName: form.householdName.trim(),
        monthlyIncomeTarget: optionalMoney(form.monthlyIncomeTarget),
        currentReserve: optionalMoney(form.currentReserve),
        reserveTarget: optionalMoney(form.reserveTarget),
        idealIncome: optionalMoney(form.idealIncome),
        riskTolerance: form.riskTolerance as FinancialProfile["riskTolerance"],
        preferredRule: form.preferredRule as FinancialProfile["preferredRule"],
        currentSituation: form.currentSituation,
        mainObjective: form.mainObjective,
        reserveMonthsDesired: Number(form.reserveMonthsDesired) as FinancialProfile["reserveMonthsDesired"],
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="entry-form" onSubmit={handleSubmit}>
      <label>
        Nome
        <input
          value={form.ownerName}
          onChange={(event) => setForm({ ...form, ownerName: event.target.value })}
          required
        />
      </label>
      <label>
        Nome da carteira
        <input
          value={form.householdName}
          onChange={(event) => setForm({ ...form, householdName: event.target.value })}
          required
        />
      </label>
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
          <option value="80-5-15">80/5/15</option>
        </select>
      </label>
      <label>
        Situação atual
        <select
          value={form.currentSituation}
          onChange={(event) => setForm({ ...form, currentSituation: event.target.value as FinancialProfile["currentSituation"] })}
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
          onChange={(event) => setForm({ ...form, mainObjective: event.target.value as FinancialProfile["mainObjective"] })}
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
        Deixe meta de reserva e renda ideal em branco para cálculo automático pelo motor financeiro.
      </p>
      <button className="primary-button" type="submit" disabled={saving}>
        {saving ? "Salvando..." : "Salvar premissas"}
      </button>
      {saved && <p className="form-success inline-message">Premissas financeiras atualizadas.</p>}
    </form>
  );
}
