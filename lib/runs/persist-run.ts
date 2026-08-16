import type { Report } from "../schemas/report";
import type { RunDepth } from "../schemas/run";
import { fail, succeed, type Outcome } from "../types/failure";
import { finishRunRecord, startRunRecord } from "../tools/database/save-run";
import { saveReport } from "../tools/database/save-report";
import { flushToolCalls } from "../tools/tool-log";

export interface PersistRunInput {
  graphRunIdentifier: string;
  documentId: string;
  depth: RunDepth;
  report: Report;
}

export interface PersistRunResult {
  documentId: string;
  runId: string;
  reportId: string;
  isFirstReport: boolean;
}

export async function persistRun(
  input: PersistRunInput
): Promise<Outcome<PersistRunResult>> {
  const context = {
    runIdentifier: null,
    nodeName: "persist-run",
    agentName: null,
  };

  const runOutcome = await startRunRecord.run(
    { documentId: input.documentId, depth: input.depth },
    context
  );

  if (!runOutcome.successful) {
    return fail("database-error", runOutcome.failure.message);
  }

  const reportOutcome = await saveReport.run(
    {
      runId: runOutcome.value.runId,
      documentId: input.documentId,
      report: input.report,
    },
    context
  );

  if (!reportOutcome.successful) {
    return fail("database-error", reportOutcome.failure.message);
  }

  await flushToolCalls(input.graphRunIdentifier, runOutcome.value.runId);

  await finishRunRecord.run(
    {
      runId: runOutcome.value.runId,
      status:
        input.report.limitations.length > 0 ? "finished-with-gaps" : "finished",
      costDollars: input.report.spend.totalDollars,
      tokensIn: input.report.spend.tokensIn,
      tokensOut: input.report.spend.tokensOut,
      errorMessage: null,
    },
    context
  );

  return succeed({
    documentId: input.documentId,
    runId: runOutcome.value.runId,
    reportId: reportOutcome.value.reportId,
    isFirstReport: false,
  });
}
