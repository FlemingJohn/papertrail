import { z } from "zod";
import { eq } from "drizzle-orm";
import { defineTool } from "../define-tool";
import { getDatabase } from "../../database/client";
import { watches } from "../../database/schema";
import { importanceSchema, watchFrequencySchema } from "../../schemas/watch";
import { calculateNextCheck } from "../../watch/schedule";

export const saveWatch = defineTool({
  name: "database_save_watch",
  description:
    "Start watching a paper, or change how often it is checked. Watching the same paper twice updates the existing settings rather than creating a duplicate.",
  inputSchema: z.object({
    documentId: z.uuid(),
    frequency: watchFrequencySchema.default("monthly"),
    notifyFrom: importanceSchema.default("medium"),
    isPaused: z.boolean().default(false),
  }),
  outputSchema: z.object({
    watchId: z.string(),
    nextCheckAt: z.string(),
  }),
  availableToAgents: false,
  execute: async (input) => {
    const database = getDatabase();
    const nextCheckAt = calculateNextCheck(input.frequency);

    const saved = await database
      .insert(watches)
      .values({
        documentId: input.documentId,
        frequency: input.frequency,
        notifyFrom: input.notifyFrom,
        isPaused: input.isPaused,
        nextCheckAt,
      })
      .onConflictDoUpdate({
        target: watches.documentId,
        set: {
          frequency: input.frequency,
          notifyFrom: input.notifyFrom,
          isPaused: input.isPaused,
          nextCheckAt,
        },
      })
      .returning({ id: watches.id, nextCheckAt: watches.nextCheckAt });

    return {
      watchId: saved[0].id,
      nextCheckAt: saved[0].nextCheckAt.toISOString(),
    };
  },
});

export const stopWatch = defineTool({
  name: "database_stop_watch",
  description: "Stop watching a paper and remove its check history.",
  inputSchema: z.object({ watchId: z.uuid() }),
  outputSchema: z.object({ removed: z.boolean() }),
  availableToAgents: false,
  execute: async (input) => {
    const database = getDatabase();
    await database.delete(watches).where(eq(watches.id, input.watchId));
    return { removed: true };
  },
});
