import { useState } from "react";
import type { ActionItem } from "../../types/finance";

export function ActionForm({ onSubmit }: { onSubmit: (action: Omit<ActionItem, "id">) => Promise<void> }) {
  const [form, setForm] = useState({
    title: "",
    reason: "",
    priority: "high",
    horizon: "30 dias",
    expectedSavings: "",
    difficulty: "media",
    status: "planned",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        title: form.title,
        reason: form.reason,
        priority: form.priority as ActionItem["priority"],
        horizon: form.horizon as ActionItem["horizon"],
        expectedSavings: Number(form.expectedSavings),
        difficulty: form.difficulty as ActionItem["difficulty"],
        status: form.status as ActionItem["status"],
      });
      setForm({ title: "", reason: "", priority: "high", horizon: "30 dias", expectedSavings: "", difficulty: "media", status: "planned" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="entry-form" onSubmit={handleSubmit}>
      <label>
        Titulo
        <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
      </label>
      <label>
        Motivo
        <input value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} required />
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
      <label>
        Prazo
        <select value={form.horizon} onChange={(event) => setForm({ ...form, horizon: event.target.value })}>
          <option value="7 dias">7 dias</option>
          <option value="30 dias">30 dias</option>
          <option value="60 dias">60 dias</option>
          <option value="90 dias">90 dias</option>
        </select>
      </label>
      <label>
        Economia estimada
        <input value={form.expectedSavings} type="number" min="0" onChange={(event) => setForm({ ...form, expectedSavings: event.target.value })} required />
      </label>
      <button className="primary-button" type="submit" disabled={saving}>
        {saving ? "Salvando..." : "Salvar acao"}
      </button>
    </form>
  );
}
