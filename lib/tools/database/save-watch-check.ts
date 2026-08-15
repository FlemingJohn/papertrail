import { z } from "zod";
import { eq } from "drizzle-orm";
import { defineTool } from "../define-tool";
import { getDatabase } from "../../database/client";
import { detectedChanges, watchChecks, watches } from "../../database/schema";
import {
  detectedChangeSchema,
  importanceSchema,
  watchFrequencySchema,
} from "../../schemas/watch";
import { calculateNextCheck } from "../../watch/schedule";

export const saveWatchCheck = defineTool({
  name: "database_save_watch_check",
  description:
    "Store the result of comparing two reports, along with every change found, and move the watch on to its next due date.",
  inputSchema: z.object({
    watchId: z.uuid(),
    frequency: watchFrequencySchema,
    previousReportId: z.uuid(),
    currentReportId: z.uuid(),
    importance: importanceSchema,
    shouldNotify: z.boolean(),
    explanation: z.string(),
    changes: z.array(detectedChangeSchema),
  }),
  outputSchema: z.object({
    watchCheckId: z.string(),
    nextCheckAt: z.string(),
  }),
  availableToAgents: false,
  execute: async (input) => {
    const database = getDatabase();

    const inserted = await database
      .insert(watchChecks)
      .values({
        watchId: input.watchId,
        previousReportId: input.previousReportId,
        currentReportId: input.currentReportId,
        importance: input.importance,
        shouldNotify: input.shouldNotify,
        explanation: input.explanation,
      })
      .returning({ id: watchChecks.id });

    const watchCheckId = inserted[0].id;

    if (input.changes.length > 0) {
      await database.insert(detectedChanges).values(
        input.changes.map((change) => ({
          watchCheckId,
          kind: change.kind,
          headline: change.headline,
          previousValue: change.previousValue,
          currentValue: change.currentValue,
          cause: change.cause,
          affectedClaimIdentifiers: change.affectedClaimIdentifiers,
        }))
      );
    }

    const nextCheckAt = calculateNextCheck(input.frequency);

    await database
      .update(watches)
      .set({ lastCheckedAt: new Date(), nextCheckAt })
      .where(eq(watches.id, input.watchId));

    return { watchCheckId, nextCheckAt: nextCheckAt.toISOString() };
  },
});
