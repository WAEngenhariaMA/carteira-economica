import { useState } from "react";
import type { Goal } from "../../types/finance";

export function GoalForm({ onSubmit }: { onSubmit: (goal: Omit<Goal, "id">) => Promise<void> }) {
  const [form, setForm] = useState({ name: "", target: "", current: "0", deadline: "", priority: "medium" });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        name: form.name,
        target: Number(form.target),
        current: Number(form.current),
        deadline: form.deadline,
        priority: form.priority as Goal["priority"],
      });
      setForm({ name: "", target: "", current: "0", deadline: "", priority: "medium" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="entry-form" onSubmit={handleSubmit}>
      <label>
        Meta
        <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
      </label>
      <label>
        Valor alvo
        <input value={form.target} type="number" min="0" onChange={(event) => setForm({ ...form, target: event.target.value })} required />
      </label>
      <label>
        Atual
        <input value={form.current} type="number" min="0" onChange={(event) => setForm({ ...form, current: event.target.value })} />
      </label>
      <label>
        Prazo
        <input value={form.deadline} type="date" onChange={(event) => setForm({ ...form, deadline: event.target.value })} required />
      </label>
      <label>
        Prioridade
        <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
          <option value="urgent">Urgente</option>
          <option value="high">Alta</option>
          <option value="medium">Media</option>
          <option value="low">Baixa</option>
        </select>
      </label>
      <button className="primary-button" type="submit" disabled={saving}>
        {saving ? "Salvando..." : "Salvar meta"}
      </button>
    </form>
  );
}
