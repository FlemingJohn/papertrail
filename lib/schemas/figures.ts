import { z } from "zod";

export const tableSpecSchema = z.object({
  caption: z.string().max(240),
  columns: z.array(z.string().max(60)).min(2).max(6),
  rows: z.array(z.array(z.string().max(160)).min(2).max(6)).max(12),
  footnote: z.string().max(300),
});

export type TableSpec = z.infer<typeof tableSpecSchema>;

export const tableSetSchema = z.object({
  tables: z.array(tableSpecSchema).max(3),
});

export type TableSet = z.infer<typeof tableSetSchema>;

export const diagramKindSchema = z.enum(["flow", "comparison", "timeline"]);

export type DiagramKind = z.infer<typeof diagramKindSchema>;

export const diagramNodeSchema = z.object({
  identifier: z.string().max(24),
  label: z.string().max(48),
  detail: z.string().max(80),
  group: z.enum(["established", "proposed", "measured"]),
});

export type DiagramNode = z.infer<typeof diagramNodeSchema>;

export const diagramEdgeSchema = z.object({
  from: z.string().max(24),
  to: z.string().max(24),
  label: z.string().max(40),
});

export type DiagramEdge = z.infer<typeof diagramEdgeSchema>;

export const diagramSpecSchema = z.object({
  caption: z.string().max(240),
  kind: diagramKindSchema,
  nodes: z.array(diagramNodeSchema).min(2).max(9),
  edges: z.array(diagramEdgeSchema).max(12),
});

export type DiagramSpec = z.infer<typeof diagramSpecSchema>;

export const diagramSetSchema = z.object({
  diagrams: z.array(diagramSpecSchema).max(2),
});

export type DiagramSet = z.infer<typeof diagramSetSchema>;
