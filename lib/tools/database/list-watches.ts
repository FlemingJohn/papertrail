import { z } from "zod";
import { and, desc, eq, lte } from "drizzle-orm";
import { defineTool } from "../define-tool";
import { getDatabase } from "../../database/client";
import { documents, watchChecks, watches } from "../../database/schema";
import { importanceSchema, watchFrequencySchema } from "../../schemas/watch";

const watchSummarySchema = z.object({
  watchId: z.string(),
  documentId: z.string(),
  title: z.string(),
  frequency: watchFrequencySchema,
  notifyFrom: importanceSchema,
  isPaused: z.boolean(),
  lastCheckedAt: z.string().nullable(),
  nextCheckAt: z.string(),
  latestImportance: importanceSchema.nullable(),
  latestExplanation: z.string().nullable(),
  checkCount: z.number().int().nonnegative(),
});

export type WatchSummary = z.infer<typeof watchSummarySchema>;

export const listWatches = defineTool({
  name: "database_list_watches",
  description: "List every watched paper with the result of its last check.",
  inputSchema: z.object({}),
  outputSchema: z.object({ watches: z.array(watchSummarySchema) }),
  availableToAgents: false,
  execute: async () => {
    const database = getDatabase();

    const rows = await database
      .select({
        watchId: watches.id,
        documentId: watches.documentId,
        title: documents.title,
        frequency: watches.frequency,
        notifyFrom: watches.notifyFrom,
        isPaused: watches.isPaused,
        lastCheckedAt: watches.lastCheckedAt,
        nextCheckAt: watches.nextCheckAt,
      })
      .from(watches)
      .innerJoin(documents, eq(watches.documentId, documents.id))
      .orderBy(desc(watches.nextCheckAt));

    const summaries = await Promise.all(
      rows.map(async (row) => {
        const checks = await database
          .select({
            importance: watchChecks.importance,
            explanation: watchChecks.explanation,
          })
          .from(watchChecks)
          .where(eq(watchChecks.watchId, row.watchId))
          .orderBy(desc(watchChecks.createdAt));

        return {
          watchId: row.watchId,
          documentId: row.documentId,
          title: row.title,
          frequency: watchFrequencySchema.parse(row.frequency),
          notifyFrom: importanceSchema.parse(row.notifyFrom),
          isPaused: row.isPaused,
          lastCheckedAt: row.lastCheckedAt?.toISOString() ?? null,
          nextCheckAt: row.nextCheckAt.toISOString(),
          latestImportance:
            checks.length === 0
              ? null
              : importanceSchema.parse(checks[0].importance),
          latestExplanation: checks[0]?.explanation ?? null,
          checkCount: checks.length,
        };
      })
    );

    return { watches: summaries };
  },
});

export const findDueWatches = defineTool({
  name: "database_find_due_watches",
  description:
    "List watched papers whose next check is due. Paused watches are excluded.",
  inputSchema: z.object({
    limit: z.number().int().min(1).max(50).default(10),
  }),
  outputSchema: z.object({
    watches: z.array(
      z.object({
        watchId: z.string(),
        documentId: z.string(),
        title: z.string(),
        frequency: watchFrequencySchema,
        notifyFrom: importanceSchema,
      })
    ),
  }),
  availableToAgents: false,
  execute: async (input) => {
    const database = getDatabase();

    const rows = await database
      .select({
        watchId: watches.id,
        documentId: watches.documentId,
        title: documents.title,
        frequency: watches.frequency,
        notifyFrom: watches.notifyFrom,
      })
      .from(watches)
      .innerJoin(documents, eq(watches.documentId, documents.id))
      .where(
        and(eq(watches.isPaused, false), lte(watches.nextCheckAt, new Date()))
      )
      .limit(input.limit);

    return {
      watches: rows.map((row) => ({
        watchId: row.watchId,
        documentId: row.documentId,
        title: row.title,
        frequency: watchFrequencySchema.parse(row.frequency),
        notifyFrom: importanceSchema.parse(row.notifyFrom),
      })),
    };
  },
});
