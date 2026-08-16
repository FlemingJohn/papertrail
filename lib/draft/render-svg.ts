import type { DiagramSpec } from "../schemas/figures";
import { layoutDiagram } from "./layout-diagram";
import { escapeHtml } from "./escape-html";

const boxWidth = 150;
const boxHeight = 62;
const columnGap = 66;
const rowGap = 30;
const padding = 14;

const fillByGroup: Record<string, string> = {
  established: "#eef1f5",
  proposed: "#fff4e0",
  measured: "#eaf3ec",
};

const strokeByGroup: Record<string, string> = {
  established: "#9aa5b4",
  proposed: "#d9a441",
  measured: "#7fa889",
};

export function renderDiagramSvg(spec: DiagramSpec): string {
  const layout = layoutDiagram(spec);

  if (layout.nodes.length === 0) {
    return "";
  }

  const width =
    padding * 2 + layout.columnCount * boxWidth + (layout.columnCount - 1) * columnGap;
  const height =
    padding * 2 + layout.rowCount * boxHeight + (layout.rowCount - 1) * rowGap;

  const centreOf = (column: number, row: number) => ({
    x: padding + column * (boxWidth + columnGap) + boxWidth / 2,
    y: padding + row * (boxHeight + rowGap) + boxHeight / 2,
  });

  const positions = new Map(
    layout.nodes.map((node) => [node.identifier, centreOf(node.column, node.row)])
  );

  const edges = layout.edges
    .map((edge) => {
      const from = positions.get(edge.from);
      const to = positions.get(edge.to);

      if (from === undefined || to === undefined) {
        return "";
      }

      const startX = to.x > from.x ? from.x + boxWidth / 2 : from.x;
      const endX = to.x > from.x ? to.x - boxWidth / 2 - 7 : to.x;

      const line = `<line x1="${startX.toFixed(1)}" y1="${from.y.toFixed(1)}" x2="${endX.toFixed(1)}" y2="${to.y.toFixed(1)}" stroke="#8d97a5" stroke-width="1" marker-end="url(#papertrailArrowHead)" />`;

      if (edge.label.trim().length === 0) {
        return line;
      }

      const labelX = (startX + endX) / 2;
      const labelY = (from.y + to.y) / 2 - 5;

      return `${line}<text x="${labelX.toFixed(1)}" y="${labelY.toFixed(1)}" text-anchor="middle" font-size="9" fill="#5b6472">${escapeHtml(edge.label)}</text>`;
    })
    .join("");

  const boxes = layout.nodes
    .map((node) => {
      const centre = positions.get(node.identifier);

      if (centre === undefined) {
        return "";
      }

      const x = centre.x - boxWidth / 2;
      const y = centre.y - boxHeight / 2;
      const fill = fillByGroup[node.group] ?? fillByGroup.established;
      const stroke = strokeByGroup[node.group] ?? strokeByGroup.established;

      const detail =
        node.detail.trim().length === 0
          ? ""
          : `<text x="${centre.x.toFixed(1)}" y="${(centre.y + 14).toFixed(1)}" text-anchor="middle" font-size="9" fill="#5b6472">${escapeHtml(truncate(node.detail, 30))}</text>`;

      return [
        `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${boxWidth}" height="${boxHeight}" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="1" />`,
        `<text x="${centre.x.toFixed(1)}" y="${(centre.y - 2).toFixed(1)}" text-anchor="middle" font-size="11" fill="#1c2430">${escapeHtml(truncate(node.label, 24))}</text>`,
        detail,
      ].join("");
    })
    .join("");

  return [
    `<svg viewBox="0 0 ${width} ${height}" width="100%" role="img" aria-label="${escapeHtml(spec.caption)}" xmlns="http://www.w3.org/2000/svg">`,
    '<defs><marker id="papertrailArrowHead" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1 L 7 4 L 0 7 z" fill="#8d97a5" /></marker></defs>',
    edges,
    boxes,
    "</svg>",
  ].join("");
}

function truncate(value: string, limit: number): string {
  return value.length <= limit ? value : `${value.slice(0, limit - 1)}…`;
}
