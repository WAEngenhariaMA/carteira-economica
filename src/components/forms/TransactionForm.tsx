import { useEffect, useMemo, useState } from "react";
import { formatNumberInput, normalizeMoneyInput } from "../../lib/formatters";
import type {
  FinancialCategory,
  PaymentRail,
  Transaction,
} from "../../types/finance";

interface TransactionFormProps {
  competence: string;
  type: "income" | "expense";
  categories: FinancialCategory[];
  initialValue?: Transaction | null;
  onCancel?: () => void;
  onSubmit: (transaction: Omit<Transaction, "id">) => Promise<void>;
}

interface TransactionFormState {
  date: string;
  description: string;
  amount: string;
  categoryId: string;
  subcategoryId: string;
  category: string;
  subcategory: string;
  bank: string;
  paymentRail: PaymentRail;
  essentiality: string;
  status: Transaction["status"];
  fixed: boolean;
  recurring: boolean;
}

function getInitialCategory(
  type: "income" | "expense",
  categories: FinancialCategory[],
) {
  return categories.find(
    (category) =>
      categoryBelongsToTransactionType(category, type) && !category.parentId && category.isActive,
  );
}

function categoryBelongsToTransactionType(
  category: FinancialCategory,
  type: "income" | "expense",
) {
  if (type === "income") return category.type === "income" || category.type === "transfer";
  return category.type === "expense" || category.type === "debt" || category.type === "investment" || category.type === "transfer";
}

function buildInitialForm(
  competence: string,
  type: "income" | "expense",
  categories: FinancialCategory[],
  initialValue?: Transaction | null,
): TransactionFormState {
  const initialCategory = initialValue
    ? categories.find(
        (category) =>
          categoryBelongsToTransactionType(category, type) &&
          !category.parentId &&
          category.name === initialValue.category,
      )
    : getInitialCategory(type, categories);
  const initialSubcategory = initialValue && initialCategory
    ? categories.find(
        (category) =>
          category.parentId === initialCategory.id &&
          category.name === initialValue.subcategory,
      )
    : undefined;

  return {
    date: initialValue?.date ?? `${competence}-01`,
    description: initialValue?.description ?? "",
    amount: formatNumberInput(initialValue?.amount),
    categoryId: initialCategory?.id ?? "",
    subcategoryId: initialSubcategory?.id ?? "",
    category:
      initialCategory?.name ??
      initialValue?.category ??
      (type === "income" ? "Receitas" : "Sem categoria"),
    subcategory: initialSubcategory?.name ?? initialValue?.subcategory ?? "",
    bank: initialValue?.bank ?? "",
    paymentRail: initialValue?.paymentRail ?? "bank",
    essentiality:
      initialValue?.essentiality ??
      (type === "income"
        ? "important"
        : (initialCategory?.essentiality ?? "essential")),
    status: initialValue?.status ?? (type === "income" ? "paid" : "open"),
    fixed: initialValue?.fixed ?? false,
    recurring: initialValue?.recurring ?? false,
  };
}

function statusOptions(type: "income" | "expense") {
  if (type === "income") {
    return [
      { value: "paid", label: "Recebida" },
      { value: "open", label: "A receber" },
      { value: "scheduled", label: "Prevista" },
    ] as const;
  }

  return [
    { value: "paid", label: "Paga" },
    { value: "open", label: "Pendente" },
    { value: "scheduled", label: "Agendada" },
  ] as const;
}

export function TransactionForm({
  competence,
  type,
  categories,
  initialValue,
  onCancel,
  onSubmit,
}: TransactionFormProps) {
  const initialForm = useMemo(
    () => buildInitialForm(competence, type, categories, initialValue),
    [categories, competence, initialValue, type],
  );

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<TransactionFormState>(initialForm);
  const editingProjectedRecurring = Boolean(initialValue?.projectedFromRecurring);

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  const parentCategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          categoryBelongsToTransactionType(category, type) && !category.parentId && category.isActive,
      ),
    [categories, type],
  );

  const selectedCategory = parentCategories.find(
    (category) => category.id === form.categoryId,
  );

  const subcategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          category.parentId === form.categoryId && category.isActive,
      ),
    [categories, form.categoryId],
  );

  const selectedSubcategory = subcategories.find(
    (category) => category.id === form.subcategoryId,
  );

  function handleCategoryChange(categoryId: string) {
    const nextCategory = parentCategories.find(
      (category) => category.id === categoryId,
    );

    setForm({
      ...form,
      categoryId,
      subcategoryId: "",
      category: nextCategory?.name ?? "",
      subcategory: "",
      essentiality: nextCategory?.essentiality ?? form.essentiality,
    });
  }

  function handleSubcategoryChange(subcategoryId: string) {
    const nextSubcategory = subcategories.find(
      (category) => category.id === subcategoryId,
    );

    setForm({
      ...form,
      subcategoryId,
      subcategory: nextSubcategory?.name ?? "",
      essentiality:
        nextSubcategory?.essentiality ??
        selectedCategory?.essentiality ??
        form.essentiality,
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    try {
      await onSubmit({
        date: editingProjectedRecurring ? initialValue?.sourceDate ?? form.date : form.date,
        competence: editingProjectedRecurring ? initialValue?.sourceCompetence ?? competence : competence,
        description: form.description,
        amount: Number(form.amount),
        type,
        category: selectedCategory?.name ?? form.category,
        subcategory: selectedSubcategory?.name ?? form.subcategory,
        essentiality: form.essentiality as Transaction["essentiality"],
        recurring: form.recurring,
        fixed: form.fixed,
        paymentRail: form.paymentRail,
        bank: form.bank,
        status: form.status,
        priority: initialValue?.priority ?? (type === "income" ? "adjustable" : "mandatory"),
        impact: initialValue?.impact ?? (Number(form.amount) > 1000 ? "high" : "medium"),
        cardId: initialValue?.cardId,
        installment: initialValue?.installment,
        totalInstallments: initialValue?.totalInstallments,
        notes: initialValue?.notes,
      });

      if (!initialValue) {
        setForm((current) => ({
          ...current,
          description: "",
          amount: "",
          subcategoryId: "",
          subcategory: "",
        }));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="entry-form" onSubmit={handleSubmit}>
      <label>
        Data
        <input
          value={form.date}
          type="date"
          disabled={editingProjectedRecurring}
          onChange={(event) => setForm({ ...form, date: event.target.value })}
          required
        />
      </label>

      {editingProjectedRecurring && (
        <p className="form-success inline-message">
          Item recorrente herdado de outra competência. A edição atualiza o cadastro original e mantém a recorrência nos próximos meses.
        </p>
      )}

      <label>
        Descrição
        <input
          value={form.description}
          onChange={(event) =>
            setForm({ ...form, description: event.target.value })
          }
          required
        />
      </label>

      <label>
        Valor
        <input
          value={form.amount}
          type="number"
          min="0"
          step="0.01"
          onBlur={() => setForm({ ...form, amount: normalizeMoneyInput(form.amount) })}
          onChange={(event) => setForm({ ...form, amount: event.target.value })}
          required
        />
      </label>

      <label>
        Categoria
        <select
          value={form.categoryId}
          onChange={(event) => handleCategoryChange(event.target.value)}
          required={parentCategories.length > 0}
        >
          <option value="">Selecione</option>
          {parentCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Subcategoria
        <select
          value={form.subcategoryId}
          onChange={(event) => handleSubcategoryChange(event.target.value)}
          disabled={!form.categoryId}
        >
          <option value="">Opcional</option>
          {subcategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Banco
        <input
          value={form.bank}
          onChange={(event) => setForm({ ...form, bank: event.target.value })}
        />
      </label>

      <label>
        Origem
        <select
          value={form.paymentRail}
          onChange={(event) =>
            setForm({ ...form, paymentRail: event.target.value as PaymentRail })
          }
        >
          <option value="bank">Banco</option>
          <option value="card">Cartão</option>
          <option value="cash">Dinheiro</option>
          <option value="loan">Dívida</option>
        </select>
      </label>

      <label>
        Essencialidade
        <select
          value={form.essentiality}
          onChange={(event) =>
            setForm({ ...form, essentiality: event.target.value })
          }
        >
          <option value="essential">Essencial</option>
          <option value="important">Importante</option>
          <option value="adjustable">Ajustável</option>
          <option value="superfluous">Supérfluo</option>
          <option value="impulsive">Impulsivo</option>
        </select>
      </label>

      <label>
        Status
        <select
          value={form.status}
          onChange={(event) =>
            setForm({ ...form, status: event.target.value as Transaction["status"] })
          }
        >
          {statusOptions(type).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="check-line">
        <input
          checked={form.fixed}
          type="checkbox"
          onChange={(event) =>
            setForm({ ...form, fixed: event.target.checked })
          }
        />
        Fixo
      </label>

      <label className="check-line">
        <input
          checked={form.recurring}
          type="checkbox"
          onChange={(event) =>
            setForm({ ...form, recurring: event.target.checked })
          }
        />
        Recorrente
      </label>

      <div className="form-actions">
        <button className="primary-button" type="submit" disabled={saving}>
          {saving ? "Salvando..." : "Salvar"}
        </button>
        {onCancel && (
          <button className="ghost-button" type="button" onClick={onCancel} disabled={saving}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
