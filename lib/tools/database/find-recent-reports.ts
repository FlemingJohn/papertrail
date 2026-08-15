import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { defineTool } from "../define-tool";
import { getDatabase } from "../../database/client";
import { reports } from "../../database/schema";
import { reportSchema } from "../../schemas/report";

export const findRecentReports = defineTool({
  name: "database_find_recent_reports",
  description:
    "Read the most recent stored reports for a paper, newest first. Two are needed to detect what has changed.",
  inputSchema: z.object({
    documentId: z.uuid(),
    limit: z.number().int().min(1).max(20).default(2),
  }),
  outputSchema: z.object({
    reports: z.array(
      z.object({
        reportId: z.string(),
        createdAt: z.string(),
        report: reportSchema,
      })
    ),
  }),
  availableToAgents: false,
  execute: async (input) => {
    const database = getDatabase();

    const rows = await database
      .select({
        id: reports.id,
        createdAt: reports.createdAt,
        payload: reports.payload,
      })
      .from(reports)
      .where(eq(reports.documentId, input.documentId))
      .orderBy(desc(reports.createdAt))
      .limit(input.limit);

    return {
      reports: rows.map((row) => ({
        reportId: row.id,
        createdAt: row.createdAt.toISOString(),
        report: row.payload,
      })),
    };
  },
});
