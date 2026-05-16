import clsx from "clsx";
import { Trash2 } from "lucide-react";
import { formatMoney } from "../../lib/formatters";
import type { Transaction } from "../../types/finance";

export function MoneyTable({
  title,
  rows,
  onDelete,
}: {
  title: string;
  rows: Transaction[];
  onDelete?: (id: string) => void;
}) {
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th>Data</th>
            <th>Descricao</th>
            <th>Categoria</th>
            <th>Origem</th>
            <th>Essencialidade</th>
            <th>Status</th>
            <th className="num">Valor</th>
            {onDelete && <th />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.date?.slice(5).replace("-", "/")}</td>
              <td>
                <strong>{row.description}</strong>
                <span>{row.subcategory || "Sem subcategoria"}</span>
              </td>
              <td>{row.category}</td>
              <td>{row.paymentRail}</td>
              <td>
                <span className={clsx("tag", `tag-${row.essentiality}`)}>{row.essentiality}</span>
              </td>
              <td>{row.status}</td>
              <td className="num">{formatMoney(row.amount)}</td>
              {onDelete && (
                <td className="row-actions">
                  <button className="ghost-button icon-only" type="button" onClick={() => onDelete(row.id)}>
                    <Trash2 size={15} />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
