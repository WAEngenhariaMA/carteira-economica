import { useMemo, useState } from "react";
import {
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Search,
  Tags,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
} from "lucide-react";
import type {
  CategoryType,
  Essentiality,
  FinancialCategory,
} from "../../types/finance";
import { categoryService } from "../../services/categoryService";
import { RiskPill } from "../ui/FinanceUI";

interface CategoryManagerProps {
  userId: string;
  categories: FinancialCategory[];
  onChange: () => void;
}

interface CategoryFormState {
  name: string;
  type: CategoryType;
  essentiality: Essentiality;
  parentId: string;
  color: string;
  icon: string;
  monthlyLimit: string;
  keywords: string;
}

const categoryTypeOptions: Array<{ value: CategoryType; label: string }> = [
  { value: "income", label: "Receita" },
  { value: "expense", label: "Despesa" },
  { value: "investment", label: "Investimento" },
  { value: "debt", label: "Dívida" },
  { value: "transfer", label: "Transferência" },
];

const categoryFilterOptions: Array<{ value: CategoryType | "all"; label: string }> = [
  { value: "all", label: "Todas" },
  ...categoryTypeOptions,
];

const essentialityOptions: Array<{ value: Essentiality; label: string }> = [
  { value: "essential", label: "Essencial" },
  { value: "important", label: "Importante" },
  { value: "adjustable", label: "Ajustável" },
  { value: "superfluous", label: "Supérfluo" },
  { value: "impulsive", label: "Impulsivo" },
];

function keywordsToText(keywords: string[]) {
  return keywords.join(", ");
}

function textToKeywords(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function matchesCategory(category: FinancialCategory, searchTerm: string) {
  if (!searchTerm) return true;

  return [
    category.name,
    category.parentName ?? "",
    category.type,
    category.essentiality,
    ...category.keywords,
  ].some((value) => value.toLowerCase().includes(searchTerm));
}

function emptyCategory(type: CategoryType = "expense"): CategoryFormState {
  return {
    name: "",
    type,
    essentiality: "important" as Essentiality,
    parentId: "",
    color: "#0f766e",
    icon: "Tag",
    monthlyLimit: "",
    keywords: "",
  };
}

function categoryToForm(category: FinancialCategory): CategoryFormState {
  return {
    name: category.name,
    type: category.type,
    essentiality: category.essentiality,
    parentId: category.parentId ?? "",
    color: category.color,
    icon: category.icon,
    monthlyLimit: category.monthlyLimit > 0 ? String(category.monthlyLimit) : "",
    keywords: keywordsToText(category.keywords),
  };
}

export function CategoryManager({
  userId,
  categories,
  onChange,
}: CategoryManagerProps) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [typeFilter, setTypeFilter] = useState<CategoryType | "all">("all");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyCategory());
  const [editing, setEditing] = useState<FinancialCategory | null>(null);

  const visibleCategories = useMemo(
    () => categories.filter((category) => showInactive || category.isActive),
    [categories, showInactive],
  );

  const visibleParentCategories = useMemo(
    () => visibleCategories.filter((category) => !category.parentId),
    [visibleCategories],
  );

  const searchTerm = search.trim().toLowerCase();

  const groupedCategories = useMemo(
    () =>
      visibleParentCategories
        .map((parent) => {
          const children = visibleCategories.filter((category) => category.parentId === parent.id);
          const parentMatchesType = typeFilter === "all" || parent.type === typeFilter;
          const parentMatchesSearch = matchesCategory(parent, searchTerm);
          const matchingChildren = children.filter((child) => matchesCategory(child, searchTerm));
          const shouldShowBySearch = !searchTerm || parentMatchesSearch || matchingChildren.length > 0;
          const filteredChildren = searchTerm && !parentMatchesSearch ? matchingChildren : children;

          return {
            parent,
            children: filteredChildren,
            visible: parentMatchesType && shouldShowBySearch,
          };
        })
        .filter((group) => group.visible),
    [searchTerm, typeFilter, visibleCategories, visibleParentCategories],
  );

  const activeCount = categories.filter((category) => category.isActive).length;
  const parentCount = visibleParentCategories.length;
  const childCount = visibleCategories.filter((category) => category.parentId).length;
  const parentOptions = categories.filter(
    (category) =>
      !category.parentId
      && category.id !== editing?.id
      && (category.isActive || category.id === form.parentId),
  );

  const selectedParent = parentOptions.find(
    (category) => category.id === form.parentId,
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const payload = {
        name: form.name.trim(),
        type: selectedParent?.type ?? form.type,
        essentiality: form.essentiality,
        parentId: form.parentId || undefined,
        parentName: selectedParent?.name,
        color: form.color,
        icon: form.icon.trim() || "Tag",
        monthlyLimit: Number(form.monthlyLimit || 0),
        keywords: textToKeywords(form.keywords),
        isDefault: editing?.isDefault ?? false,
        isActive: editing?.isActive ?? true,
      };

      if (editing) {
        await categoryService.update(userId, editing.id, payload);
        if (!payload.parentId && payload.name !== editing.name) {
          await categoryService.updateChildrenParentName(userId, editing.id, payload.name);
        }
      } else {
        await categoryService.create(userId, payload);
      }

      setForm(emptyCategory(form.type));
      setEditing(null);
      setMessage(editing ? "Categoria atualizada com sucesso." : "Categoria salva com sucesso.");
      onChange();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Erro ao salvar categoria.",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(category: FinancialCategory) {
    setEditing(category);
    setForm(categoryToForm(category));
    setMessage("");
  }

  function handleCancelEdit() {
    setEditing(null);
    setForm(emptyCategory(form.type));
    setMessage("");
  }

  async function handleRemove(category: FinancialCategory) {
    const childCountForParent = categories.filter((item) => item.parentId === category.id).length;
    const label = childCountForParent > 0
      ? `Excluir "${category.name}" e ${childCountForParent} subcategoria(s)?`
      : `Excluir "${category.name}"?`;

    if (!window.confirm(label)) return;

    setSaving(true);
    setMessage("");

    try {
      await categoryService.remove(userId, category.id);
      if (editing?.id === category.id || editing?.parentId === category.id) {
        setEditing(null);
        setForm(emptyCategory(form.type));
      }
      setMessage("Categoria excluída com sucesso.");
      onChange();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Erro ao excluir categoria.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRestoreDefaults() {
    setSaving(true);
    setMessage("");

    try {
      const created = await categoryService.restoreDefaults(userId);
      setMessage(
        created.length > 0
          ? `${created.length} categorias padrão restauradas.`
          : "Categorias padrão já estavam cadastradas.",
      );
      onChange();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Erro ao restaurar categorias padrão.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(category: FinancialCategory) {
    setSaving(true);
    setMessage("");

    try {
      await categoryService.update(userId, category.id, {
        isActive: !category.isActive,
      });
      onChange();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Erro ao atualizar categoria.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="category-manager">
      <div className="category-manager-header">
        <div>
          <strong>Catálogo Financeiro</strong>
          <span>
            Organize categorias, subcategorias e palavras-chave para melhorar a
            classificação e o diagnóstico.
          </span>
        </div>

        <div className="category-actions">
          <button
            className="ghost-button"
            type="button"
            onClick={() => setShowInactive((value) => !value)}
          >
            {showInactive ? (
              <ToggleRight size={16} />
            ) : (
              <ToggleLeft size={16} />
            )}
            {showInactive ? "Ocultar inativas" : "Mostrar inativas"}
          </button>

          <button
            className="ghost-button"
            type="button"
            onClick={handleRestoreDefaults}
            disabled={saving}
          >
            <RotateCcw size={16} />
            Restaurar padrão
          </button>
        </div>
      </div>

      <div className="category-overview">
        <span><strong>{parentCount}</strong> categorias principais</span>
        <span><strong>{childCount}</strong> subcategorias</span>
        <span><strong>{activeCount}</strong> ativas</span>
      </div>

      <div className="category-toolbar">
        <div className="category-type-filter" aria-label="Filtrar categorias por tipo">
          {categoryFilterOptions.map((option) => (
            <button
              className={typeFilter === option.value ? "active" : ""}
              key={option.value}
              type="button"
              onClick={() => setTypeFilter(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <label className="category-search">
          <Search size={16} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar categoria, subcategoria ou palavra-chave"
          />
        </label>
      </div>

      <form className="entry-form category-form" onSubmit={handleSubmit}>
        {editing && (
          <p className="form-success inline-message">
            Editando {editing.parentId ? "subcategoria" : "categoria"}: {editing.name}
          </p>
        )}

        <label>
          Nome
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
        </label>

        <label>
          Tipo
          <select
            value={form.type}
            onChange={(event) =>
              setForm({ ...form, type: event.target.value as CategoryType })
            }
            disabled={Boolean(form.parentId)}
          >
            {categoryTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Categoria pai
          <select
            value={form.parentId}
            onChange={(event) =>
              setForm({ ...form, parentId: event.target.value })
            }
          >
            <option value="">Categoria principal</option>
            {parentOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Essencialidade
          <select
            value={form.essentiality}
            onChange={(event) =>
              setForm({
                ...form,
                essentiality: event.target.value as Essentiality,
              })
            }
          >
            {essentialityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Cor
          <input
            value={form.color}
            type="color"
            onChange={(event) =>
              setForm({ ...form, color: event.target.value })
            }
          />
        </label>

        <label>
          Ícone
          <input
            value={form.icon}
            onChange={(event) => setForm({ ...form, icon: event.target.value })}
            placeholder="Ex.: Home"
          />
        </label>

        <label>
          Limite mensal
          <input
            value={form.monthlyLimit}
            type="number"
            min="0"
            step="0.01"
            onChange={(event) =>
              setForm({ ...form, monthlyLimit: event.target.value })
            }
            placeholder="Opcional"
          />
        </label>

        <label>
          Palavras-chave
          <input
            value={form.keywords}
            onChange={(event) =>
              setForm({ ...form, keywords: event.target.value })
            }
            placeholder="ifood, mercado, uber"
          />
        </label>

        <div className="form-actions">
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? <Save size={16} /> : editing ? <Save size={16} /> : <Plus size={16} />}
            {saving ? "Salvando..." : editing ? "Salvar alterações" : "Adicionar"}
          </button>
          {editing && (
            <button className="ghost-button" type="button" onClick={handleCancelEdit} disabled={saving}>
              <X size={16} />
              Cancelar
            </button>
          )}
        </div>
      </form>

      {message && <p className="inline-message form-success">{message}</p>}

      <div className="category-list">
        {groupedCategories.length === 0 && (
          <div className="category-empty">
            Nenhuma categoria encontrada com os filtros atuais.
          </div>
        )}

        {groupedCategories.map(({ parent, children }) => (
          <article className="category-card" key={parent.id}>
            <div className="category-card-main">
              <span
                className="category-color"
                style={{ background: parent.color }}
              />

              <div>
                <strong>{parent.name}</strong>
                <span>
                  {categoryTypeOptions.find(
                    (option) => option.value === parent.type,
                  )?.label ?? parent.type}
                </span>
              </div>

              <RiskPill
                level={parent.isActive ? "healthy" : "attention"}
                label={parent.isActive ? "Ativa" : "Inativa"}
              />

              <div className="category-card-actions">
                <button
                  className="ghost-button icon-only"
                  type="button"
                  onClick={() => handleEdit(parent)}
                  title="Editar categoria"
                >
                  <Pencil size={16} />
                </button>
                <button
                  className="ghost-button icon-only"
                  type="button"
                  onClick={() => void handleToggle(parent)}
                  title="Ativar ou desativar"
                >
                  {parent.isActive ? (
                    <ToggleRight size={16} />
                  ) : (
                    <ToggleLeft size={16} />
                  )}
                </button>
                <button
                  className="ghost-button icon-only"
                  type="button"
                  onClick={() => void handleRemove(parent)}
                  title="Excluir categoria"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="category-keywords">
              <Tags size={14} />
              {parent.keywords.length > 0
                ? keywordsToText(parent.keywords)
                : "Sem palavras-chave"}
            </div>

            <div className="subcategory-list">
              {children.length === 0 && (
                <span className="muted-note">
                  Nenhuma subcategoria cadastrada.
                </span>
              )}

              {children.map((child) => (
                <div className="subcategory-chip" key={child.id}>
                  <span>{child.name}</span>
                  <small>
                    {child.keywords.length > 0
                      ? keywordsToText(child.keywords)
                      : "sem keywords"}
                  </small>
                  <div className="subcategory-actions">
                    <button
                      className="ghost-button icon-only"
                      type="button"
                      onClick={() => handleEdit(child)}
                      title="Editar subcategoria"
                      aria-label="Editar subcategoria"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="ghost-button icon-only"
                      type="button"
                      onClick={() => void handleToggle(child)}
                      title="Ativar ou desativar subcategoria"
                      aria-label="Ativar ou desativar subcategoria"
                    >
                      {child.isActive ? (
                        <ToggleRight size={16} />
                      ) : (
                        <ToggleLeft size={16} />
                      )}
                    </button>
                    <button
                      className="ghost-button icon-only"
                      type="button"
                      onClick={() => void handleRemove(child)}
                      title="Excluir subcategoria"
                      aria-label="Excluir subcategoria"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
