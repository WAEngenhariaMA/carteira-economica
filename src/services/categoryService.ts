import { getSupabase } from "../lib/supabase";
import type {
  CategoryType,
  Essentiality,
  FinancialCategory,
} from "../types/finance";
import { categoryToRow, mapCategory } from "./mappers";

export type CategoryPayload = Omit<FinancialCategory, "id">;

const defaultCategories: Array<{
  name: string;
  type: CategoryType;
  essentiality: Essentiality;
  color: string;
  icon: string;
  keywords: string[];
  subcategories: Array<{
    name: string;
    keywords: string[];
    essentiality?: Essentiality;
  }>;
}> = [
  {
    name: "Receitas",
    type: "income",
    essentiality: "important",
    color: "#16a34a",
    icon: "Banknote",
    keywords: ["salario", "pix recebido", "transferencia recebida", "renda"],
    subcategories: [
      { name: "Salário", keywords: ["salario", "pagamento", "vale"] },
      { name: "Renda extra", keywords: ["extra", "freelance", "servico"] },
      { name: "Reembolso", keywords: ["reembolso", "devolucao"] },
      { name: "Venda", keywords: ["venda", "recebimento"] },
    ],
  },
  {
    name: "Moradia",
    type: "expense",
    essentiality: "essential",
    color: "#2563eb",
    icon: "Home",
    keywords: [
      "aluguel",
      "energia",
      "equatorial",
      "agua",
      "internet",
      "condominio",
    ],
    subcategories: [
      { name: "Aluguel", keywords: ["aluguel"], essentiality: "essential" },
      {
        name: "Energia",
        keywords: ["energia", "equatorial"],
        essentiality: "essential",
      },
      { name: "Água", keywords: ["agua", "caema"], essentiality: "essential" },
      {
        name: "Internet",
        keywords: ["internet", "fibra", "claro", "vivo", "tim"],
        essentiality: "important",
      },
      {
        name: "Condomínio",
        keywords: ["condominio"],
        essentiality: "essential",
      },
    ],
  },
  {
    name: "Alimentação",
    type: "expense",
    essentiality: "important",
    color: "#f97316",
    icon: "Utensils",
    keywords: ["mercado", "supermercado", "ifood", "restaurante", "padaria"],
    subcategories: [
      {
        name: "Mercado",
        keywords: ["mercado", "supermercado", "atacadao", "mateus"],
        essentiality: "essential",
      },
      {
        name: "Restaurante",
        keywords: ["restaurante", "bar", "lanchonete"],
        essentiality: "adjustable",
      },
      {
        name: "Delivery",
        keywords: ["ifood", "delivery", "aiqfome"],
        essentiality: "superfluous",
      },
      {
        name: "Lanche",
        keywords: ["lanche", "hamburguer", "pizza"],
        essentiality: "adjustable",
      },
      {
        name: "Bebidas",
        keywords: ["bebida", "cerveja", "chopp"],
        essentiality: "superfluous",
      },
    ],
  },
  {
    name: "Transporte",
    type: "expense",
    essentiality: "important",
    color: "#0f766e",
    icon: "Car",
    keywords: ["uber", "99", "combustivel", "posto", "estacionamento"],
    subcategories: [
      {
        name: "Combustível",
        keywords: ["combustivel", "gasolina", "posto", "etanol"],
        essentiality: "important",
      },
      {
        name: "App de transporte",
        keywords: ["uber", "99", "mobizap"],
        essentiality: "adjustable",
      },
      {
        name: "Ônibus",
        keywords: ["onibus", "bilhete"],
        essentiality: "essential",
      },
      {
        name: "Manutenção veículo",
        keywords: ["oficina", "pneu", "oleo"],
        essentiality: "important",
      },
      {
        name: "Estacionamento",
        keywords: ["estacionamento"],
        essentiality: "adjustable",
      },
    ],
  },
  {
    name: "Saúde",
    type: "expense",
    essentiality: "essential",
    color: "#dc2626",
    icon: "HeartPulse",
    keywords: ["farmacia", "medico", "hospital", "exame", "plano de saude"],
    subcategories: [
      {
        name: "Farmácia",
        keywords: ["farmacia", "drogaria"],
        essentiality: "essential",
      },
      {
        name: "Consultas",
        keywords: ["consulta", "medico", "clinica"],
        essentiality: "essential",
      },
      {
        name: "Exames",
        keywords: ["exame", "laboratorio", "ressonancia"],
        essentiality: "essential",
      },
      {
        name: "Plano de saúde",
        keywords: ["plano de saude", "unimed", "amil"],
        essentiality: "essential",
      },
    ],
  },
  {
    name: "Educação",
    type: "expense",
    essentiality: "important",
    color: "#4f46e5",
    icon: "GraduationCap",
    keywords: ["faculdade", "curso", "livro", "educacao", "escola"],
    subcategories: [
      {
        name: "Faculdade",
        keywords: ["faculdade", "mensalidade"],
        essentiality: "important",
      },
      {
        name: "Cursos",
        keywords: ["curso", "udemy", "alura"],
        essentiality: "important",
      },
      {
        name: "Livros",
        keywords: ["livro", "ebook"],
        essentiality: "adjustable",
      },
    ],
  },
  {
    name: "Lazer",
    type: "expense",
    essentiality: "superfluous",
    color: "#7c3aed",
    icon: "Gamepad2",
    keywords: ["cinema", "show", "bar", "viagem", "lazer"],
    subcategories: [
      {
        name: "Cinema e eventos",
        keywords: ["cinema", "show", "evento"],
        essentiality: "superfluous",
      },
      {
        name: "Bares",
        keywords: ["bar", "pub", "choperia"],
        essentiality: "superfluous",
      },
      {
        name: "Viagem",
        keywords: ["hotel", "pousada", "passagem", "viagem"],
        essentiality: "superfluous",
      },
    ],
  },
  {
    name: "Cartões",
    type: "debt",
    essentiality: "important",
    color: "#0ea5e9",
    icon: "CreditCard",
    keywords: ["nubank", "c6", "picpay", "neon", "renner", "fatura"],
    subcategories: [
      { name: "Nubank", keywords: ["nubank"] },
      { name: "C6 Bank", keywords: ["c6", "c6 bank"] },
      { name: "PicPay", keywords: ["picpay"] },
      { name: "Neon", keywords: ["neon"] },
      { name: "Renner", keywords: ["renner"] },
    ],
  },
  {
    name: "Dívidas",
    type: "debt",
    essentiality: "important",
    color: "#b45309",
    icon: "Landmark",
    keywords: ["emprestimo", "financiamento", "acordo", "cheque especial"],
    subcategories: [
      { name: "Empréstimo", keywords: ["emprestimo"] },
      { name: "Financiamento", keywords: ["financiamento"] },
      { name: "Parcelamento de fatura", keywords: ["parcelamento de fatura"] },
      { name: "Acordo", keywords: ["acordo", "renegociacao"] },
      { name: "Cheque especial", keywords: ["cheque especial"] },
    ],
  },
  {
    name: "Investimentos",
    type: "investment",
    essentiality: "important",
    color: "#059669",
    icon: "TrendingUp",
    keywords: ["cdb", "tesouro", "investimento", "reserva"],
    subcategories: [
      { name: "Reserva", keywords: ["reserva", "emergencia"] },
      { name: "CDB", keywords: ["cdb"] },
      { name: "Tesouro", keywords: ["tesouro"] },
    ],
  },
  {
    name: "Família",
    type: "expense",
    essentiality: "important",
    color: "#db2777",
    icon: "Users",
    keywords: ["familia", "presente", "ajuda", "casa"],
    subcategories: [
      {
        name: "Ajuda familiar",
        keywords: ["ajuda", "familia"],
        essentiality: "important",
      },
      { name: "Presentes", keywords: ["presente"], essentiality: "adjustable" },
      {
        name: "Pets",
        keywords: ["pet", "ração", "veterinario"],
        essentiality: "important",
      },
    ],
  },
  {
    name: "Outros",
    type: "expense",
    essentiality: "adjustable",
    color: "#64748b",
    icon: "CircleEllipsis",
    keywords: ["outros", "diversos"],
    subcategories: [
      { name: "Não classificado", keywords: ["sem categoria", "outros"] },
    ],
  },
];

function normalizeText(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR");
}

function uniqueNames(categories: FinancialCategory[]) {
  return new Set(
    categories.map(
      (category) =>
        `${category.parentId ?? "root"}:${normalizeText(category.name)}`,
    ),
  );
}

export const categoryService = {
  async list(userId: string) {
    const { data, error } = await getSupabase()
      .from("categories")
      .select("*")
      .eq("user_id", userId)
      .order("parent_id", { ascending: true, nullsFirst: true })
      .order("name", { ascending: true });

    if (error) throw error;
    return (data ?? []).map(mapCategory);
  },

  async create(userId: string, category: CategoryPayload) {
    const { data, error } = await getSupabase()
      .from("categories")
      .insert({ ...categoryToRow(category), user_id: userId })
      .select("*")
      .single();

    if (error) throw error;
    return mapCategory(data);
  },

  async update(
    userId: string,
    id: string,
    category: Partial<FinancialCategory>,
  ) {
    const { data, error } = await getSupabase()
      .from("categories")
      .update(categoryToRow(category))
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return mapCategory(data);
  },

  async deactivate(userId: string, id: string) {
    const { error } = await getSupabase()
      .from("categories")
      .update({ is_active: false })
      .eq("user_id", userId)
      .eq("id", id);

    if (error) throw error;
  },

  async updateChildrenParentName(userId: string, parentId: string, parentName: string) {
    const { error } = await getSupabase()
      .from("categories")
      .update({ parent_name: parentName })
      .eq("user_id", userId)
      .eq("parent_id", parentId);

    if (error) throw error;
  },

  async remove(userId: string, id: string) {
    const { error: childrenError } = await getSupabase()
      .from("categories")
      .delete()
      .eq("user_id", userId)
      .eq("parent_id", id);

    if (childrenError) throw childrenError;

    const { error } = await getSupabase()
      .from("categories")
      .delete()
      .eq("user_id", userId)
      .eq("id", id);

    if (error) throw error;
  },

  async restoreDefaults(userId: string) {
    const existing = await this.list(userId);
    const existingNames = uniqueNames(existing);
    const created: FinancialCategory[] = [];

    for (const category of defaultCategories) {
      const rootKey = `root:${normalizeText(category.name)}`;
      const root = existing.find(
        (item) =>
          !item.parentId &&
          normalizeText(item.name) === normalizeText(category.name),
      );

      const rootCategory =
        root ??
        (existingNames.has(rootKey)
          ? undefined
          : await this.create(userId, {
              name: category.name,
              type: category.type,
              essentiality: category.essentiality,
              parentName: undefined,
              color: category.color,
              icon: category.icon,
              monthlyLimit: 0,
              keywords: category.keywords,
              isDefault: true,
              isActive: true,
            }));

      if (rootCategory) {
        created.push(rootCategory);
        existingNames.add(rootKey);
      }

      const parent = rootCategory ?? root;
      if (!parent) continue;

      for (const subcategory of category.subcategories) {
        const subKey = `${parent.id}:${normalizeText(subcategory.name)}`;
        const alreadyExists = existing.some(
          (item) =>
            item.parentId === parent.id &&
            normalizeText(item.name) === normalizeText(subcategory.name),
        );

        if (alreadyExists || existingNames.has(subKey)) continue;

        const createdSubcategory = await this.create(userId, {
          name: subcategory.name,
          type: category.type,
          essentiality: subcategory.essentiality ?? category.essentiality,
          parentId: parent.id,
          parentName: parent.name,
          color: category.color,
          icon: category.icon,
          monthlyLimit: 0,
          keywords: subcategory.keywords,
          isDefault: true,
          isActive: true,
        });

        created.push(createdSubcategory);
        existingNames.add(subKey);
      }
    }

    return created;
  },
};
