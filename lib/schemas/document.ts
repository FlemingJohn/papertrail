import { z } from "zod";

export const pageLocationSchema = z.object({
  pageNumber: z.number().int().positive(),
  polygon: z.array(z.number()).length(8),
});

export type PageLocation = z.infer<typeof pageLocationSchema>;

export const textBlockSchema = z.object({
  text: z.string(),
  role: z.string().nullable(),
  location: pageLocationSchema,
});

export type TextBlock = z.infer<typeof textBlockSchema>;

export const tableCellSchema = z.object({
  rowIndex: z.number().int().nonnegative(),
  columnIndex: z.number().int().nonnegative(),
  text: z.string(),
});

export type TableCell = z.infer<typeof tableCellSchema>;

export const documentTableSchema = z.object({
  caption: z.string().nullable(),
  location: pageLocationSchema,
  cells: z.array(tableCellSchema),
});

export type DocumentTable = z.infer<typeof documentTableSchema>;

export const documentFigureSchema = z.object({
  caption: z.string().nullable(),
  location: pageLocationSchema,
});

export type DocumentFigure = z.infer<typeof documentFigureSchema>;

export const referenceEntrySchema = z.object({
  marker: z.string(),
  rawText: z.string(),
});

export type ReferenceEntry = z.infer<typeof referenceEntrySchema>;

export const parsedDocumentSchema = z.object({
  markdown: z.string(),
  textBlocks: z.array(textBlockSchema),
  tables: z.array(documentTableSchema),
  figures: z.array(documentFigureSchema),
  references: z.array(referenceEntrySchema),
  pageCount: z.number().int().positive(),
});

export type ParsedDocument = z.infer<typeof parsedDocumentSchema>;
