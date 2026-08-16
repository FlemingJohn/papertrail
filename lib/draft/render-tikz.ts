import type { DiagramSpec } from "../schemas/figures";
import { escapeLatex } from "./escape-latex";
import { layoutDiagram } from "./layout-diagram";

const columnSpacing = 4.2;
const rowSpacing = 2.1;

const fillByGroup: Record<string, string> = {
  established: "papertrailEstablished",
  proposed: "papertrailProposed",
  measured: "papertrailMeasured",
};

export function renderTikzFigure(spec: DiagramSpec, label: string): string {
  const layout = layoutDiagram(spec);

  if (layout.nodes.length === 0) {
    return "";
  }

  const nodeLines = layout.nodes.map((node) => {
    const x = (node.column * columnSpacing).toFixed(2);
    const y = (-node.row * rowSpacing).toFixed(2);
    const fill = fillByGroup[node.group] ?? "papertrailEstablished";
    const body =
      node.detail.trim().length === 0
        ? escapeLatex(node.label)
        : `${escapeLatex(node.label)}\\\\[2pt]{\\scriptsize ${escapeLatex(node.detail)}}`;

    return `  \\node[papertrailBox, fill=${fill}] (${node.identifier}) at (${x},${y}) {${body}};`;
  });

  const edgeLines = layout.edges.map((edge) => {
    if (edge.label.trim().length === 0) {
      return `  \\draw[papertrailArrow] (${edge.from}) -- (${edge.to});`;
    }

    return `  \\draw[papertrailArrow] (${edge.from}) -- node[papertrailEdgeLabel] {${escapeLatex(edge.label)}} (${edge.to});`;
  });

  return [
    "\\begin{figure}[t]",
    "  \\centering",
    "  \\begin{tikzpicture}",
    ...nodeLines,
    ...edgeLines,
    "  \\end{tikzpicture}",
    `  \\caption{${escapeLatex(spec.caption)}}`,
    `  \\label{fig:${label}}`,
    "\\end{figure}",
  ].join("\n");
}

export const tikzPreamble = `
\\usepackage{tikz}
\\usetikzlibrary{arrows.meta, positioning}
\\definecolor{papertrailEstablished}{HTML}{EEF1F5}
\\definecolor{papertrailProposed}{HTML}{FFF4E0}
\\definecolor{papertrailMeasured}{HTML}{EAF3EC}
\\tikzset{
  papertrailBox/.style={
    draw=black!45, line width=0.4pt, rounded corners=1.5pt,
    align=center, inner sep=5pt, text width=2.9cm, font=\\small
  },
  papertrailArrow/.style={-{Stealth[length=4pt]}, draw=black!55, line width=0.4pt},
  papertrailEdgeLabel/.style={font=\\scriptsize, fill=white, inner sep=1.5pt}
}
`.trim();
