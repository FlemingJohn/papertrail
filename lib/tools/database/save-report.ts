import { z } from "zod";
import { defineTool } from "../define-tool";
import { getDatabase } from "../../database/client";
import { reports } from "../../database/schema";
import { reportSchema } from "../../schemas/report";

export const saveReport = defineTool({
  name: "database_save_report",
  description:
    "Store a finished report so later checks can compare against it. The stored copy is never modified, which is what makes a comparison months later trustworthy.",
  inputSchema: z.object({
    runId: z.uuid(),
    documentId: z.uuid(),
    report: reportSchema,
  }),
  outputSchema: z.object({ reportId: z.string() }),
  availableToAgents: false,
  execute: async (input) => {
    const database = getDatabase();

    const inserted = await database
      .insert(reports)
      .values({
        runId: input.runId,
        documentId: input.documentId,
        fingerprint: input.report.fingerprint,
        payload: input.report,
      })
      .returning({ id: reports.id });

    return { reportId: inserted[0].id };
  },
});
