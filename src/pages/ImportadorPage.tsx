import { useMemo, useState, type ChangeEvent } from "react";
import { Upload } from "lucide-react";
import { parseSpreadsheet, type ImportPreview } from "../lib/importer";
import { importService, validateImportPreview, type ValidatedImportRow } from "../services/importService";
import { EmptyState, IconBadge, Panel, RiskPill } from "../components/ui/FinanceUI";
import { formatMoney, importFieldLabel } from "../lib/formatters";
import type { WorkspacePageProps } from "../app/routes";

export function ImportadorPage({ userId, workspace, refresh }: WorkspacePageProps) {
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [batchId, setBatchId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const nextPreview = await parseSpreadsheet(file);
    const nextMapping = nextPreview.mapping;
    const sourceType = file.name.toLowerCase().endsWith(".csv") ? "csv" : "xlsx";
    const batch = await importService.createBatch(userId, nextPreview, sourceType, nextMapping);
    setPreview(nextPreview);
    setMapping(nextMapping);
    setBatchId(batch.id);
  }

  const validatedRows: ValidatedImportRow[] = useMemo(() => {
    if (!preview) return [];
    return validateImportPreview(preview, mapping, workspace.transactions);
  }, [mapping, preview, workspace.transactions]);

  const errorCount = validatedRows.reduce(
    (total, row) => total + row.issues.filter((issue) => issue.severity === "error").length,
    0,
  );
  const duplicateCount = validatedRows.filter((row) => row.duplicate).length;

  return (
    <div className="screen-stack">
      <Panel title="Envio e Validação">
        <div className="upload-zone">
          <IconBadge icon={Upload} tone="neutral" />
          <div>
            <strong>Excel ou CSV</strong>
            <span>O lote é registrado em import_batches, validado e só depois gravado como transação.</span>
          </div>
          <label className="primary-button file-button">
            Selecionar arquivo
            <input accept=".xlsx,.csv" type="file" onChange={handleFile} />
          </label>
        </div>
      </Panel>

      {!preview && (
        <EmptyState
          title="Nenhum arquivo carregado"
          description="Anexe uma fatura, extrato ou planilha para iniciar o mapeamento assistido."
        />
      )}

      {preview && (
        <>
          <Panel title={`Mapeamento: ${preview.fileName}`}>
            <div className="mapping-grid">
              {["date", "description", "amount", "category", "card", "bank", "installment", "competence"].map((field) => (
                <label className="mapping-card" key={field}>
                  <span>{importFieldLabel(field)}</span>
                  <select value={mapping[field] ?? ""} onChange={(event) => setMapping({ ...mapping, [field]: event.target.value })}>
                    <option value="">Não mapear</option>
                    {preview.columns.map((column) => (
                      <option key={column} value={column}>{column}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <div className="import-summary">
              <RiskPill level={errorCount > 0 ? "critical" : "healthy"} label={`${errorCount} erros`} />
              <RiskPill level={duplicateCount > 0 ? "risk" : "healthy"} label={`${duplicateCount} duplicados`} />
              <RiskPill level="attention" label={`${validatedRows.length} linhas`} />
              <button
                className="primary-button"
                type="button"
                disabled={saving || errorCount > 0 || !batchId}
                onClick={async () => {
                  if (!batchId) return;
                  setSaving(true);
                  try {
                    await importService.persistValidated(userId, batchId, validatedRows);
                    refresh();
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? "Importando..." : "Confirmar importação"}
              </button>
            </div>
          </Panel>

          <Panel title="Prévia Validada" className="table-panel">
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Linha</th>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Categoria</th>
                    <th>Qualidade</th>
                    <th className="num">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {validatedRows.slice(0, 20).map((row) => (
                    <tr key={row.rowIndex}>
                      <td>{row.rowIndex}</td>
                      <td>{row.transaction.date || "-"}</td>
                      <td>{row.transaction.description || "-"}</td>
                      <td>{row.transaction.category}</td>
                      <td>
                        {row.duplicate ? <RiskPill level="risk" label="Duplicado" /> : row.issues.length > 0 ? <RiskPill level="critical" label={row.issues[0].message} /> : <RiskPill level="healthy" label="OK" />}
                      </td>
                      <td className="num">{formatMoney(row.transaction.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
