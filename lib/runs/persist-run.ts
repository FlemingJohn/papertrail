import type { Report } from "../schemas/report";
import type { RunDepth } from "../schemas/run";
import { fail, succeed, type Outcome } from "../types/failure";
import { upsertDocument } from "../tools/database/upsert-document";
import { finishRunRecord, startRunRecord } from "../tools/database/save-run";
import { saveReport } from "../tools/database/save-report";

export interface PersistRunInput {
  contentFingerprint: string;
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

  const documentOutcome = await upsertDocument.run(
    {
      title: input.report.paperTitle,
      contentFingerprint: input.contentFingerprint,
      pageCount: input.report.pageCount,
      digitalObjectIdentifier: input.report.paperIdentifier,
    },
    context
  );

  if (!documentOutcome.successful) {
    return fail("database-error", documentOutcome.failure.message);
  }

  const runOutcome = await startRunRecord.run(
    { documentId: documentOutcome.value.documentId, depth: input.depth },
    context
  );

  if (!runOutcome.successful) {
    return fail("database-error", runOutcome.failure.message);
  }

  const reportOutcome = await saveReport.run(
    {
      runId: runOutcome.value.runId,
      documentId: documentOutcome.value.documentId,
      report: input.report,
    },
    context
  );

  if (!reportOutcome.successful) {
    return fail("database-error", reportOutcome.failure.message);
  }

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
    documentId: documentOutcome.value.documentId,
    runId: runOutcome.value.runId,
    reportId: reportOutcome.value.reportId,
    isFirstReport: documentOutcome.value.wasCreated,
  });
}
