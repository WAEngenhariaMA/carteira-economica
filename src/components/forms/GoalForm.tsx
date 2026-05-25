import { useEffect, useState } from "react";
import { formatNumberInput, normalizeMoneyInput } from "../../lib/formatters";
import type { Goal } from "../../types/finance";

export function GoalForm({
  onSubmit,
  initialValue,
  onCancel,
}: {
  onSubmit: (goal: Omit<Goal, "id">) => Promise<void>;
  initialValue?: Goal | null;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState({
    name: initialValue?.name ?? "",
    target: initialValue ? formatNumberInput(initialValue.target) : "",
    current: initialValue ? formatNumberInput(initialValue.current) : "0.00",
    deadline: initialValue?.deadline ?? "",
    priority: initialValue?.priority ?? "medium",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      name: initialValue?.name ?? "",
      target: initialValue ? formatNumberInput(initialValue.target) : "",
      current: initialValue ? formatNumberInput(initialValue.current) : "0.00",
      deadline: initialValue?.deadline ?? "",
      priority: initialValue?.priority ?? "medium",
    });
  }, [initialValue]);

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
      if (!initialValue) {
        setForm({ name: "", target: "", current: "0.00", deadline: "", priority: "medium" });
      }
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
        <input
          value={form.target}
          type="number"
          min="0"
          step="0.01"
          onBlur={() => setForm({ ...form, target: normalizeMoneyInput(form.target) })}
          onChange={(event) => setForm({ ...form, target: event.target.value })}
          required
        />
      </label>
      <label>
        Atual
        <input
          value={form.current}
          type="number"
          min="0"
          step="0.01"
          onBlur={() => setForm({ ...form, current: normalizeMoneyInput(form.current) })}
          onChange={(event) => setForm({ ...form, current: event.target.value })}
        />
      </label>
      <label>
        Prazo
        <input value={form.deadline} type="date" onChange={(event) => setForm({ ...form, deadline: event.target.value })} required />
      </label>
      <label>
        Prioridade
        <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as Goal["priority"] })}>
          <option value="urgent">Urgente</option>
          <option value="high">Alta</option>
          <option value="medium">Média</option>
          <option value="low">Baixa</option>
        </select>
      </label>
      <div className="form-actions">
        <button className="primary-button" type="submit" disabled={saving}>
          {saving ? "Salvando..." : initialValue ? "Atualizar meta" : "Salvar meta"}
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
