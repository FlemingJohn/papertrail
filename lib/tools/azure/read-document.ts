import { z } from "zod";
import type { AnalyzeResultOutput } from "@azure-rest/ai-document-intelligence";
import { defineTool } from "../define-tool";
import { parsedDocumentSchema } from "../../schemas/document";
import type {
  DocumentFigure,
  DocumentTable,
  PageLocation,
  ReferenceEntry,
  TextBlock,
} from "../../schemas/document";
import { analyseLayout } from "./document-client";

const fallbackLocation: PageLocation = {
  pageNumber: 1,
  polygon: [0, 0, 0, 0, 0, 0, 0, 0],
};

export const readDocument = defineTool({
  name: "read_document",
  description:
    "Convert an uploaded PDF into structured text, keeping the page number and position of every paragraph, table and figure so that any statement can be traced back to where it appears.",
  inputSchema: z.object({
    base64Source: z.string().min(100),
  }),
  outputSchema: parsedDocumentSchema,
  timeoutMilliseconds: 180000,
  retryAttempts: 1,
  availableToAgents: false,
  execute: async ({ base64Source }) => {
    const analysis = await analyseLayout(base64Source);

    return {
      markdown: analysis.content,
      textBlocks: collectTextBlocks(analysis),
      tables: collectTables(analysis),
      figures: collectFigures(analysis),
      references: collectReferences(analysis),
      pageCount: analysis.pages.length,
    };
  },
});

function readLocation(
  boundingRegions:
    | Array<{ pageNumber: number; polygon?: number[] }>
    | undefined
): PageLocation {
  const region = boundingRegions?.[0];

  if (region === undefined) {
    return fallbackLocation;
  }

  const polygon = region.polygon ?? [];

  return {
    pageNumber: region.pageNumber,
    polygon: polygon.length === 8 ? polygon : fallbackLocation.polygon,
  };
}

function collectTextBlocks(analysis: AnalyzeResultOutput): TextBlock[] {
  const paragraphs = analysis.paragraphs ?? [];

  return paragraphs.map((paragraph) => ({
    text: paragraph.content,
    role: paragraph.role ?? null,
    location: readLocation(paragraph.boundingRegions),
  }));
}

function collectTables(analysis: AnalyzeResultOutput): DocumentTable[] {
  const tables = analysis.tables ?? [];

  return tables.map((table) => ({
    caption: table.caption?.content ?? null,
    location: readLocation(table.boundingRegions),
    cells: table.cells.map((cell) => ({
      rowIndex: cell.rowIndex,
      columnIndex: cell.columnIndex,
      text: cell.content,
    })),
  }));
}

function collectFigures(analysis: AnalyzeResultOutput): DocumentFigure[] {
  const figures = analysis.figures ?? [];

  return figures.map((figure) => ({
    caption: figure.caption?.content ?? null,
    location: readLocation(figure.boundingRegions),
  }));
}

function collectReferences(analysis: AnalyzeResultOutput): ReferenceEntry[] {
  const paragraphs = analysis.paragraphs ?? [];

  const referenceStartIndex = paragraphs.findIndex(
    (paragraph) =>
      paragraph.role === "sectionHeading" &&
      /^(references|bibliography|works cited|literature cited)/i.test(
        paragraph.content.trim()
      )
  );

  if (referenceStartIndex === -1) {
    return [];
  }

  const entries: ReferenceEntry[] = [];

  for (
    let index = referenceStartIndex + 1;
    index < paragraphs.length;
    index += 1
  ) {
    const paragraph = paragraphs[index];

    if (paragraph.role === "sectionHeading") {
      break;
    }

    const text = paragraph.content.trim();

    if (text.length < 20) {
      continue;
    }

    entries.push({
      marker: extractMarker(text, entries.length + 1),
      rawText: text,
    });
  }

  return entries;
}

function extractMarker(text: string, fallbackNumber: number): string {
  const bracketMatch = text.match(/^\[(\d+)\]/);
  if (bracketMatch !== null) {
    return `[${bracketMatch[1]}]`;
  }

  const numberMatch = text.match(/^(\d+)[.)]\s/);
  if (numberMatch !== null) {
    return `[${numberMatch[1]}]`;
  }

  return `[${fallbackNumber}]`;
}
