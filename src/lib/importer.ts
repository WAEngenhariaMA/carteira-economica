import type { Row } from "read-excel-file/browser";

export interface ImportPreview {
  fileName: string;
  sheetName: string;
  rows: Record<string, unknown>[];
  columns: string[];
  mapping: Record<string, string>;
}

const aliases: Record<string, string[]> = {
  date: ["data", "dt", "lançamento", "lancamento", "data compra", "data movimento"],
  description: ["descrição", "descricao", "histórico", "historico", "detalhe", "estabelecimento", "memo"],
  amount: ["valor", "vlr", "amount", "débito", "debito", "crédito", "credito"],
  category: ["categoria", "grupo", "classificação", "classificacao"],
  card: ["cartão", "cartao", "card", "bandeira"],
  bank: ["banco", "conta", "instituição", "instituicao"],
  installment: ["parcela", "n parcela", "parcelamento"],
  competence: ["competência", "competencia", "mês", "mes", "referência", "referencia"],
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function suggestMapping(columns: string[]) {
  return Object.entries(aliases).reduce<Record<string, string>>((acc, [field, fieldAliases]) => {
    const match = columns.find((column) => {
      const normalizedColumn = normalize(column);
      return fieldAliases.some((alias) => normalizedColumn.includes(normalize(alias)));
    });

    if (match) {
      acc[field] = match;
    }

    return acc;
  }, {});
}

export async function parseSpreadsheet(file: File): Promise<ImportPreview> {
  const isCsv = file.name.toLowerCase().endsWith(".csv");
  const matrix: Row[] = isCsv ? parseCsv(await file.text()) : await readXlsx(file);
  const headers = (matrix[0] ?? []).map((value, index) => String(value || `Coluna ${index + 1}`));
  const rows = matrix.slice(1).map((line) =>
    headers.reduce<Record<string, unknown>>((acc, header, index) => {
      acc[header] = line[index] ?? "";
      return acc;
    }, {}),
  );
  const columns = headers.filter(Boolean);

  return {
    fileName: file.name,
    sheetName: isCsv ? "CSV" : "Planilha 1",
    rows,
    columns,
    mapping: suggestMapping(columns),
  };
}

async function readXlsx(file: File): Promise<Row[]> {
  const { readSheet } = await import("read-excel-file/browser");
  return readSheet(file);
}

function parseCsv(content: string) {
  return content
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const semicolonCells = line.split(";");
      const commaCells = line.split(",");
      return semicolonCells.length > commaCells.length ? semicolonCells : commaCells;
    });
}
