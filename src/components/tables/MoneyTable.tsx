import clsx from "clsx";
import { Pencil, Trash2 } from "lucide-react";
import { essentialityLabel, formatDateShort, formatMoney, paymentRailLabel, transactionStatusLabel } from "../../lib/formatters";
import type { Transaction } from "../../types/finance";

export function MoneyTable({
  title,
  rows,
  onEdit,
  onDelete,
}: {
  title: string;
  rows: Transaction[];
  onEdit?: (row: Transaction) => void;
  onDelete?: (id: string) => void;
}) {
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th>Data</th>
            <th>Descrição</th>
            <th>Categoria</th>
            <th>Origem</th>
            <th>Essencialidade</th>
            <th>Status</th>
            <th className="num">Valor</th>
            {(onEdit || onDelete) && <th>Ações</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{formatDateShort(row.date)}</td>
              <td>
                <strong>{row.description}</strong>
                <span>{row.projectedFromRecurring ? "Recorrente nesta competência" : row.subcategory || "Sem subcategoria"}</span>
              </td>
              <td>{row.category}</td>
              <td>{paymentRailLabel(row.paymentRail)}</td>
              <td>
                <span className={clsx("tag", `tag-${row.essentiality}`)}>{essentialityLabel(row.essentiality)}</span>
              </td>
              <td>
                <span className={clsx("risk-pill", `status-${row.status}`)}>
                  {transactionStatusLabel(row.status, row.type)}
                </span>
              </td>
              <td className="num">{formatMoney(row.amount)}</td>
              {(onEdit || onDelete) && (
                <td className="table-actions">
                  {onEdit && (
                    <button className="ghost-button icon-only" type="button" aria-label="Editar lançamento" onClick={() => onEdit(row)}>
                      <Pencil size={15} />
                    </button>
                  )}
                  {onDelete && (
                    <button className="ghost-button icon-only" type="button" aria-label="Excluir lançamento" onClick={() => onDelete(row.id)}>
                      <Trash2 size={15} />
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
