import { useMemo, useState } from "react";
import { chartToTable, tableToChartData, addTableRow, addTableColumn, deleteTableRow, renameColumn } from "../lib/table.js";

export default function DataSheet({ chart, onChange }) {
  const table = useMemo(() => chartToTable(chart), [chart]);
  const [columns, setColumns] = useState(table.columns);
  const [rows, setRows] = useState(() => table.rows.map((r) => [...r]));

  const push = (cols, nextRows) => {
    setColumns(cols);
    setRows(nextRows);
    onChange({ ...chart, data: tableToChartData({ ...chart }, cols, nextRows) });
  };

  const setCell = (ri, ci, val) => {
    const next = rows.map((r, i) => (i === ri ? r.map((c, j) => (j === ci ? val : c)) : r));
    push(columns, next);
  };

  const setHeader = (ci, val) => {
    const cols = renameColumn(columns, ci, val);
    push(cols, rows);
  };

  return (
    <div className="sheet-wrap">
      <div className="sheet-tools">
        <button type="button" className="btn btn-sm" onClick={() => push(columns, addTableRow(columns, rows))}>
          + Row
        </button>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => {
            const next = addTableColumn(columns, rows);
            push(next.columns, next.rows);
          }}
        >
          + Series
        </button>
        <span className="muted">Click any cell. This is the Think-Cell sheet — PowerPoint export keeps values editable.</span>
      </div>
      <div className="sheet">
        <table>
          <thead>
            <tr>
              <th />
              {columns.map((c, ci) => (
                <th key={ci}>
                  <input value={c} onChange={(e) => setHeader(ci, e.target.value)} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                <td className="row-kill">
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => push(columns, deleteTableRow(rows, ri))} title="Delete row">
                    ×
                  </button>
                </td>
                {row.map((cell, ci) => (
                  <td key={ci}>
                    <input value={cell ?? ""} onChange={(e) => setCell(ri, ci, e.target.value)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
