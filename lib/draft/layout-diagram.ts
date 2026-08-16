import type { DiagramEdge, DiagramSpec } from "../schemas/figures";

export interface PlacedNode {
  identifier: string;
  label: string;
  detail: string;
  group: "established" | "proposed" | "measured";
  column: number;
  row: number;
}

export interface DiagramLayout {
  caption: string;
  nodes: PlacedNode[];
  edges: DiagramEdge[];
  columnCount: number;
  rowCount: number;
}

export function layoutDiagram(spec: DiagramSpec): DiagramLayout {
  const known = new Set(spec.nodes.map((node) => node.identifier));
  const edges = spec.edges.filter(
    (edge) => known.has(edge.from) && known.has(edge.to) && edge.from !== edge.to
  );

  const placed =
    spec.kind === "comparison"
      ? placeByGroup(spec)
      : spec.kind === "timeline"
        ? placeInOneLine(spec)
        : placeByDepth(spec, edges);

  const columnCount = placed.reduce(
    (highest, node) => Math.max(highest, node.column + 1),
    1
  );
  const rowCount = placed.reduce(
    (highest, node) => Math.max(highest, node.row + 1),
    1
  );

  return {
    caption: spec.caption,
    nodes: placed,
    edges,
    columnCount,
    rowCount,
  };
}

function placeInOneLine(spec: DiagramSpec): PlacedNode[] {
  return spec.nodes.map((node, index) => ({
    ...node,
    column: index,
    row: 0,
  }));
}

function placeByGroup(spec: DiagramSpec): PlacedNode[] {
  const order: PlacedNode["group"][] = ["established", "proposed", "measured"];
  const placed: PlacedNode[] = [];

  order.forEach((group, column) => {
    const inGroup = spec.nodes.filter((node) => node.group === group);
    inGroup.forEach((node, row) => {
      placed.push({ ...node, column, row });
    });
  });

  const usedColumns = [...new Set(placed.map((node) => node.column))].sort(
    (first, second) => first - second
  );

  return placed.map((node) => ({
    ...node,
    column: usedColumns.indexOf(node.column),
  }));
}

function placeByDepth(spec: DiagramSpec, edges: DiagramEdge[]): PlacedNode[] {
  const depthByIdentifier = new Map<string, number>();

  for (const node of spec.nodes) {
    depthByIdentifier.set(node.identifier, 0);
  }

  for (let pass = 0; pass < spec.nodes.length; pass += 1) {
    let changed = false;

    for (const edge of edges) {
      const fromDepth = depthByIdentifier.get(edge.from) ?? 0;
      const toDepth = depthByIdentifier.get(edge.to) ?? 0;

      if (toDepth < fromDepth + 1) {
        depthByIdentifier.set(edge.to, fromDepth + 1);
        changed = true;
      }
    }

    if (!changed) {
      break;
    }
  }

  const rowByColumn = new Map<number, number>();

  return spec.nodes.map((node) => {
    const column = depthByIdentifier.get(node.identifier) ?? 0;
    const row = rowByColumn.get(column) ?? 0;
    rowByColumn.set(column, row + 1);

    return { ...node, column, row };
  });
}
