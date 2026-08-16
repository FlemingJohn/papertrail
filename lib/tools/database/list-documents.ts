import { z } from "zod";
import { desc, eq, sql } from "drizzle-orm";
import { defineTool } from "../define-tool";
import { getDatabase } from "../../database/client";
import { documents, reports, runs } from "../../database/schema";
import { parsedDocumentSchema } from "../../schemas/document";

const problemVerdicts = new Set([
  "not-supported",
  "wrong-source",
  "source-not-found",
  "retracted",
]);

const documentSummarySchema = z.object({
  documentId: z.string(),
  title: z.string(),
  pageCount: z.number().int().nonnegative(),
  blockCount: z.number().int().nonnegative(),
  referenceCount: z.number().int().nonnegative(),
  tableCount: z.number().int().nonnegative(),
  addedAt: z.string(),
  checkCount: z.number().int().nonnegative(),
  latestReportId: z.string().nullable(),
  problemCount: z.number().int().nonnegative(),
});

export type DocumentSummary = z.infer<typeof documentSummarySchema>;

export const listDocuments = defineTool({
  name: "database_list_documents",
  description:
    "List every paper in the knowledge base with what was extracted from it and how often it has been checked.",
  inputSchema: z.object({}),
  outputSchema: z.object({ documents: z.array(documentSummarySchema) }),
  availableToAgents: false,
  execute: async () => {
    const database = getDatabase();

    const rows = await database
      .select({
        documentId: documents.id,
        title: documents.title,
        pageCount: documents.pageCount,
        addedAt: documents.createdAt,
        extractedContent: documents.extractedContent,
      })
      .from(documents)
      .orderBy(desc(documents.createdAt));

    const summaries: DocumentSummary[] = [];

    for (const row of rows) {
      const latest = await database
        .select({ id: reports.id, payload: reports.payload })
        .from(reports)
        .where(eq(reports.documentId, row.documentId))
        .orderBy(desc(reports.createdAt))
        .limit(1);

      const counted = await database
        .select({ total: sql<number>`count(*)::int` })
        .from(runs)
        .where(eq(runs.documentId, row.documentId));

      const extraction = row.extractedContent;

      summaries.push({
        documentId: row.documentId,
        title: row.title,
        pageCount: row.pageCount,
        blockCount: extraction?.textBlocks.length ?? 0,
        referenceCount: extraction?.references.length ?? 0,
        tableCount: extraction?.tables.length ?? 0,
        addedAt: row.addedAt.toISOString(),
        checkCount: counted[0]?.total ?? 0,
        latestReportId: latest[0]?.id ?? null,
        problemCount:
          latest[0]?.payload.citationChecks.filter((check) =>
            problemVerdicts.has(check.judgement.verdict)
          ).length ?? 0,
      });
    }

    return { documents: summaries };
  },
});

export const readDocumentRecord = defineTool({
  name: "database_read_document",
  description:
    "Read one paper from the knowledge base, including everything the document reader extracted from it.",
  inputSchema: z.object({ documentId: z.uuid() }),
  outputSchema: z.object({
    documentId: z.string(),
    title: z.string(),
    pageCount: z.number().int().nonnegative(),
    addedAt: z.string(),
    extractedContent: parsedDocumentSchema.nullable(),
    latestReportId: z.string().nullable(),
  }),
  availableToAgents: false,
  execute: async (input) => {
    const database = getDatabase();

    const rows = await database
      .select()
      .from(documents)
      .where(eq(documents.id, input.documentId))
      .limit(1);

    if (rows.length === 0) {
      throw new Error(`No paper with identifier ${input.documentId}`);
    }

    const latest = await database
      .select({ id: reports.id })
      .from(reports)
      .where(eq(reports.documentId, input.documentId))
      .orderBy(desc(reports.createdAt))
      .limit(1);

    return {
      documentId: rows[0].id,
      title: rows[0].title,
      pageCount: rows[0].pageCount,
      addedAt: rows[0].createdAt.toISOString(),
      extractedContent: rows[0].extractedContent,
      latestReportId: latest[0]?.id ?? null,
    };
  },
});
