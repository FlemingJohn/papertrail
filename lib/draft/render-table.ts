import type { TableSpec } from "../schemas/figures";
import { escapeLatex } from "./escape-latex";

export function renderLatexTable(spec: TableSpec, label: string): string {
  const columnCount = spec.columns.length;

  if (columnCount === 0) {
    return "";
  }

  const alignment = spec.columns
    .map((_, index) => (index === 0 ? "l" : "l"))
    .join("");

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

  const lines = [
    "\\begin{table}[t]",
    "  \\centering",
    "  \\small",
    `  \\begin{tabular}{${alignment}}`,
    "    \\toprule",
    `    ${headerRow} \\\\`,
    "    \\midrule",
    ...bodyRows.map((row) => `    ${row}`),
    "    \\bottomrule",
    "  \\end{tabular}",
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
