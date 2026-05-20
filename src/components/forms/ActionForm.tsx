import { useEffect, useState } from "react";
import type { ActionItem } from "../../types/finance";

export function ActionForm({
  onSubmit,
  initialValue,
  onCancel,
}: {
  onSubmit: (action: Omit<ActionItem, "id">) => Promise<void>;
  initialValue?: ActionItem | null;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState({
    title: initialValue?.title ?? "",
    reason: initialValue?.reason ?? "",
    priority: initialValue?.priority ?? "high",
    horizon: initialValue?.horizon ?? "30 dias",
    expectedSavings: initialValue ? String(initialValue.expectedSavings) : "",
    difficulty: initialValue?.difficulty ?? "media",
    status: initialValue?.status ?? "planned",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      title: initialValue?.title ?? "",
      reason: initialValue?.reason ?? "",
      priority: initialValue?.priority ?? "high",
      horizon: initialValue?.horizon ?? "30 dias",
      expectedSavings: initialValue ? String(initialValue.expectedSavings) : "",
      difficulty: initialValue?.difficulty ?? "media",
      status: initialValue?.status ?? "planned",
    });
  }, [initialValue]);

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
      if (!initialValue) {
        setForm({ title: "", reason: "", priority: "high", horizon: "30 dias", expectedSavings: "", difficulty: "media", status: "planned" });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="entry-form" onSubmit={handleSubmit}>
      <label>
        Título
        <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
      </label>
      <label>
        Motivo
        <input value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} required />
      </label>
      <label>
        Prioridade
        <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as ActionItem["priority"] })}>
          <option value="urgent">Urgente</option>
          <option value="high">Alta</option>
          <option value="medium">Média</option>
          <option value="low">Baixa</option>
        </select>
      </label>
      <label>
        Prazo
        <select value={form.horizon} onChange={(event) => setForm({ ...form, horizon: event.target.value as ActionItem["horizon"] })}>
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
      <label>
        Dificuldade
        <select value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value as ActionItem["difficulty"] })}>
          <option value="baixa">Baixa</option>
          <option value="media">Média</option>
          <option value="alta">Alta</option>
        </select>
      </label>
      <label>
        Status
        <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ActionItem["status"] })}>
          <option value="planned">Planejada</option>
          <option value="running">Em andamento</option>
          <option value="done">Concluída</option>
        </select>
      </label>
      <div className="form-actions">
        <button className="primary-button" type="submit" disabled={saving}>
          {saving ? "Salvando..." : initialValue ? "Atualizar ação" : "Salvar ação"}
        </button>
        {initialValue && onCancel && (
          <button className="ghost-button" type="button" onClick={onCancel}>
            Cancelar edição
          </button>
        )}
      </div>
    </form>
  );
}
