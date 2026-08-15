import { z } from "zod";
import { eq } from "drizzle-orm";
import { defineTool } from "../define-tool";
import { getDatabase } from "../../database/client";
import { runs } from "../../database/schema";
import { runDepthSchema, runStatusSchema } from "../../schemas/run";

export const startRunRecord = defineTool({
  name: "database_start_run",
  description: "Record that an analysis run has begun.",
  inputSchema: z.object({
    documentId: z.uuid(),
    depth: runDepthSchema,
  }),
  outputSchema: z.object({ runId: z.string() }),
  availableToAgents: false,
  execute: async (input) => {
    const database = getDatabase();

    const inserted = await database
      .insert(runs)
      .values({ documentId: input.documentId, depth: input.depth })
      .returning({ id: runs.id });

    return { runId: inserted[0].id };
  },
});

export const finishRunRecord = defineTool({
  name: "database_finish_run",
  description:
    "Record that an analysis run has ended, with its final status and cost.",
  inputSchema: z.object({
    runId: z.uuid(),
    status: runStatusSchema,
    costDollars: z.number().nonnegative(),
    tokensIn: z.number().int().nonnegative(),
    tokensOut: z.number().int().nonnegative(),
    errorMessage: z.string().nullable(),
  }),
  outputSchema: z.object({ saved: z.boolean() }),
  availableToAgents: false,
  execute: async (input) => {
    const database = getDatabase();

    await database
      .update(runs)
      .set({
        status: input.status,
        finishedAt: new Date(),
        costDollars: input.costDollars.toFixed(6),
        tokensIn: input.tokensIn,
        tokensOut: input.tokensOut,
        errorMessage: input.errorMessage,
      })
      .where(eq(runs.id, input.runId));

    return { saved: true };
  },
});
