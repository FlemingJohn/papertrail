import { z } from "zod";
import { desc, eq, sql } from "drizzle-orm";
import { defineTool } from "../define-tool";
import { getDatabase } from "../../database/client";
import { documents, reports, runs, toolCalls } from "../../database/schema";
import { reportSchema } from "../../schemas/report";

const reportSummarySchema = z.object({
  reportId: z.string(),
  runId: z.string(),
  documentId: z.string(),
  title: z.string(),
  createdAt: z.string(),
  depth: z.string(),
  status: z.string(),
  costDollars: z.number(),
  claimsFound: z.number().int().nonnegative(),
  citationsChecked: z.number().int().nonnegative(),
  citationProblems: z.number().int().nonnegative(),
});

export type ReportSummary = z.infer<typeof reportSummarySchema>;

const problemVerdicts = new Set([
  "not-supported",
  "wrong-source",
  "source-not-found",
  "retracted",
]);

export const listReports = defineTool({
  name: "database_list_reports",
  description:
    "List every stored report, newest first, so an earlier check can be reopened without paying to run it again.",
  inputSchema: z.object({
    limit: z.number().int().min(1).max(100).default(50),
  }),
  outputSchema: z.object({ reports: z.array(reportSummarySchema) }),
  availableToAgents: false,
  execute: async (input) => {
    const database = getDatabase();

    const rows = await database
      .select({
        reportId: reports.id,
        runId: reports.runId,
        documentId: reports.documentId,
        payload: reports.payload,
        createdAt: reports.createdAt,
        title: documents.title,
        depth: runs.depth,
        status: runs.status,
        costDollars: runs.costDollars,
      })
      .from(reports)
      .innerJoin(documents, eq(reports.documentId, documents.id))
      .innerJoin(runs, eq(reports.runId, runs.id))
      .orderBy(desc(reports.createdAt))
      .limit(input.limit);

    return {
      reports: rows.map((row) => ({
        reportId: row.reportId,
        runId: row.runId,
        documentId: row.documentId,
        title: row.payload.paperTitle || row.title,
        createdAt: row.createdAt.toISOString(),
        depth: row.depth,
        status: row.status,
        costDollars: Number(row.costDollars),
        claimsFound: row.payload.claims.length,
        citationsChecked: row.payload.citationChecks.length,
        citationProblems: row.payload.citationChecks.filter((check) =>
          problemVerdicts.has(check.judgement.verdict)
        ).length,
      })),
    };
  },
});

export const readReport = defineTool({
  name: "database_read_report",
  description: "Read one stored report in full so it can be reopened.",
  inputSchema: z.object({ reportId: z.uuid() }),
  outputSchema: z.object({ report: reportSchema }),
  availableToAgents: false,
  execute: async (input) => {
    const database = getDatabase();

    const rows = await database
      .select({ payload: reports.payload })
      .from(reports)
      .where(eq(reports.id, input.reportId))
      .limit(1);

    if (rows.length === 0) {
      throw new Error(`No stored report with identifier ${input.reportId}`);
    }

    return { report: rows[0].payload };
  },
});

export const summariseUsage = defineTool({
  name: "database_summarise_usage",
  description:
    "Total spend, tokens, pages and lookups across every run, so the cost of the tool over time is visible.",
  inputSchema: z.object({}),
  outputSchema: z.object({
    runCount: z.number().int().nonnegative(),
    paperCount: z.number().int().nonnegative(),
    totalDollars: z.number(),
    tokensIn: z.number().int().nonnegative(),
    tokensOut: z.number().int().nonnegative(),
    toolCallCount: z.number().int().nonnegative(),
    cacheHitCount: z.number().int().nonnegative(),
    failedCallCount: z.number().int().nonnegative(),
  }),
  availableToAgents: false,
  execute: async () => {
    const database = getDatabase();

    const runTotals = await database
      .select({
        runCount: sql<number>`count(*)::int`,
        paperCount: sql<number>`count(distinct ${runs.documentId})::int`,
        totalDollars: sql<string>`coalesce(sum(${runs.costDollars}), 0)`,
        tokensIn: sql<number>`coalesce(sum(${runs.tokensIn}), 0)::int`,
        tokensOut: sql<number>`coalesce(sum(${runs.tokensOut}), 0)::int`,
      })
      .from(runs);

    const callTotals = await database
      .select({
        toolCallCount: sql<number>`count(*)::int`,
        cacheHitCount: sql<number>`count(*) filter (where ${toolCalls.servedFromCache})::int`,
        failedCallCount: sql<number>`count(*) filter (where ${toolCalls.status} not in ('succeeded', 'cache-hit'))::int`,
      })
      .from(toolCalls);

    return {
      runCount: runTotals[0].runCount,
      paperCount: runTotals[0].paperCount,
      totalDollars: Number(runTotals[0].totalDollars),
      tokensIn: runTotals[0].tokensIn,
      tokensOut: runTotals[0].tokensOut,
      toolCallCount: callTotals[0].toolCallCount,
      cacheHitCount: callTotals[0].cacheHitCount,
      failedCallCount: callTotals[0].failedCallCount,
    };
  },
});
