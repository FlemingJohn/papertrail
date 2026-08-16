import type { TableSpec } from "../schemas/figures";
import { escapeLatex } from "./escape-latex";

const shortCellLength = 18;

export function renderLatexTable(spec: TableSpec, label: string): string {
  const columnCount = spec.columns.length;

  if (columnCount === 0) {
    return "";
  }

  const longestByColumn = spec.columns.map((column, index) =>
    spec.rows.reduce(
      (longest, row) => Math.max(longest, (row[index] ?? "").length),
      column.length
    )
  );

  const alignment = longestByColumn
    .map((longest) =>
      longest <= shortCellLength ? "l" : ">{\\raggedright\\arraybackslash}X"
    )
    .join("");

  const hasWrappingColumn = alignment.includes("X");

  const headerRow = spec.columns
    .map((column) => `\\textbf{${escapeLatex(column)}}`)
    .join(" & ");

  const bodyRows = spec.rows.map((row) => {
    const cells: string[] = [];

    for (let index = 0; index < columnCount; index += 1) {
      const value = row[index];
      cells.push(
        value === undefined || value.trim().length === 0
          ? "not reported"
          : escapeLatex(value)
      );
    }

    return `${cells.join(" & ")} \\\\`;
  });

  const openTabular = hasWrappingColumn
    ? `  \\begin{tabularx}{\\textwidth}{${alignment}}`
    : `  \\begin{tabular}{${alignment}}`;

  const closeTabular = hasWrappingColumn
    ? "  \\end{tabularx}"
    : "  \\end{tabular}";

  const lines = [
    "\\begin{table}[t]",
    "  \\centering",
    "  \\small",
    openTabular,
    "    \\toprule",
    `    ${headerRow} \\\\`,
    "    \\midrule",
    ...bodyRows.map((row) => `    ${row}`),
    "    \\bottomrule",
    closeTabular,
    `  \\caption{${escapeLatex(spec.caption)}}`,
    `  \\label{tab:${label}}`,
  ];

  if (spec.footnote.trim().length > 0) {
    lines.push(
      `  \\vspace{2pt}{\\scriptsize ${escapeLatex(spec.footnote)}\\par}`
    );
  }

  lines.push("\\end{table}");

  return lines.join("\n");
}
