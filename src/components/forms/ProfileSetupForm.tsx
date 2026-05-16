import { useState } from "react";
import type { FinancialProfile } from "../../types/finance";

export function ProfileSetupForm({ onSubmit }: { onSubmit: (profile: Omit<FinancialProfile, "id">) => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    ownerName: "",
    householdName: "Minha carteira",
    monthlyIncomeTarget: "",
    currentReserve: "0",
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
        monthlyIncomeTarget: Number(form.monthlyIncomeTarget),
        currentReserve: Number(form.currentReserve),
        reserveTarget: Number(form.reserveTarget),
        idealIncome: Number(form.idealIncome),
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
        <input value={form.monthlyIncomeTarget} type="number" min="0" onChange={(event) => setForm({ ...form, monthlyIncomeTarget: event.target.value })} required />
      </label>
      <label>
        Reserva atual
        <input value={form.currentReserve} type="number" min="0" onChange={(event) => setForm({ ...form, currentReserve: event.target.value })} />
      </label>
      <label>
        Meta de reserva
        <input value={form.reserveTarget} type="number" min="0" onChange={(event) => setForm({ ...form, reserveTarget: event.target.value })} required />
      </label>
      <label>
        Renda ideal
        <input value={form.idealIncome} type="number" min="0" onChange={(event) => setForm({ ...form, idealIncome: event.target.value })} required />
      </label>
      <button className="primary-button" type="submit" disabled={saving}>
        {saving ? "Criando..." : "Criar perfil financeiro"}
      </button>
    </form>
  );
}
