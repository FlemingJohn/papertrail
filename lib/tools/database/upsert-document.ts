import { z } from "zod";
import { eq } from "drizzle-orm";
import { defineTool } from "../define-tool";
import { getDatabase } from "../../database/client";
import { documents } from "../../database/schema";
import { parsedDocumentSchema } from "../../schemas/document";

export const upsertDocument = defineTool({
  name: "database_upsert_document",
  description:
    "Find a stored paper by the fingerprint of its file, or create it if this is the first time it has been seen.",
  inputSchema: z.object({
    title: z.string().min(1),
    contentFingerprint: z.string().min(16),
    pageCount: z.number().int().positive(),
    digitalObjectIdentifier: z.string().nullable(),
    extractedContent: parsedDocumentSchema.nullable(),
  }),
  outputSchema: z.object({
    documentId: z.string(),
    wasCreated: z.boolean(),
  }),
  availableToAgents: false,
  execute: async (input) => {
    const database = getDatabase();

    const existing = await database
      .select({ id: documents.id, extractedContent: documents.extractedContent })
      .from(documents)
      .where(eq(documents.contentFingerprint, input.contentFingerprint))
      .limit(1);

    if (existing.length > 0) {
      if (existing[0].extractedContent === null && input.extractedContent !== null) {
        await database
          .update(documents)
          .set({ extractedContent: input.extractedContent })
          .where(eq(documents.id, existing[0].id));
      }

      return { documentId: existing[0].id, wasCreated: false };
    }

    const inserted = await database
      .insert(documents)
      .values({
        title: input.title,
        contentFingerprint: input.contentFingerprint,
        pageCount: input.pageCount,
        digitalObjectIdentifier: input.digitalObjectIdentifier,
        extractedContent: input.extractedContent,
      })
      .returning({ id: documents.id });

    return { documentId: inserted[0].id, wasCreated: true };
  },
});

export const findStoredExtraction = defineTool({
  name: "database_find_stored_extraction",
  description:
    "Look for a previously stored reading of the same file, so the document reader does not have to run again.",
  inputSchema: z.object({
    contentFingerprint: z.string().min(16),
  }),
  outputSchema: z.object({
    extractedContent: parsedDocumentSchema.nullable(),
  }),
  availableToAgents: false,
  execute: async (input) => {
    const database = getDatabase();

    const rows = await database
      .select({ extractedContent: documents.extractedContent })
      .from(documents)
      .where(eq(documents.contentFingerprint, input.contentFingerprint))
      .limit(1);

    return { extractedContent: rows[0]?.extractedContent ?? null };
  },
});
