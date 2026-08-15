import { z } from "zod";
import { desc, eq, inArray } from "drizzle-orm";
import { defineTool } from "../define-tool";
import { getDatabase } from "../../database/client";
import { detectedChanges, watchChecks } from "../../database/schema";
import {
  changeKindSchema,
  detectedChangeSchema,
  importanceSchema,
} from "../../schemas/watch";

export const findWatchHistory = defineTool({
  name: "database_find_watch_history",
  description:
    "Read every check made on a watched paper, newest first, with the changes found in each.",
  inputSchema: z.object({
    watchId: z.uuid(),
    limit: z.number().int().min(1).max(50).default(20),
  }),
  outputSchema: z.object({
    checks: z.array(
      z.object({
        watchCheckId: z.string(),
        createdAt: z.string(),
        importance: importanceSchema,
        shouldNotify: z.boolean(),
        explanation: z.string(),
        changes: z.array(detectedChangeSchema),
      })
    ),
  }),
  availableToAgents: false,
  execute: async (input) => {
    const database = getDatabase();

    const checkRows = await database
      .select({
        id: watchChecks.id,
        createdAt: watchChecks.createdAt,
        importance: watchChecks.importance,
        shouldNotify: watchChecks.shouldNotify,
        explanation: watchChecks.explanation,
      })
      .from(watchChecks)
      .where(eq(watchChecks.watchId, input.watchId))
      .orderBy(desc(watchChecks.createdAt))
      .limit(input.limit);

    if (checkRows.length === 0) {
      return { checks: [] };
    }

    const changeRows = await database
      .select()
      .from(detectedChanges)
      .where(
        inArray(
          detectedChanges.watchCheckId,
          checkRows.map((row) => row.id)
        )
      );

    return {
      checks: checkRows.map((row) => ({
        watchCheckId: row.id,
        createdAt: row.createdAt.toISOString(),
        importance: importanceSchema.parse(row.importance),
        shouldNotify: row.shouldNotify,
        explanation: row.explanation,
        changes: changeRows
          .filter((change) => change.watchCheckId === row.id)
          .map((change) => ({
            kind: changeKindSchema.parse(change.kind),
            headline: change.headline,
            previousValue: change.previousValue,
            currentValue: change.currentValue,
            cause: change.cause,
            affectedClaimIdentifiers: change.affectedClaimIdentifiers,
          })),
      })),
    };
  },
});
