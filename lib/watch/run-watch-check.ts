import type { DetectedChange, Importance, WatchFrequency } from "../schemas/watch";
import type { RunEventWriter } from "../types/stream";
import { fail, succeed, type Outcome } from "../types/failure";
import { runAgent } from "../agents/run-agent";
import { changeFinder } from "../agents/definitions/change-finder";
import { changeRater } from "../agents/definitions/change-rater";
import { findRecentReports } from "../tools/database/find-recent-reports";
import { saveWatchCheck } from "../tools/database/save-watch-check";
import { compareReports, describeDifference } from "./compare-reports";
import { describeClaims } from "../graph/context";

export interface WatchCheckInput {
  watchId: string;
  documentId: string;
  frequency: WatchFrequency;
  notifyFrom: Importance;
  writer: RunEventWriter | null;
}

export interface WatchCheckResult {
  watchCheckId: string | null;
  importance: Importance;
  shouldNotify: boolean;
  explanation: string;
  changes: DetectedChange[];
  nextCheckAt: string | null;
}

const importanceRank: Record<Importance, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
};

export async function runWatchCheck(
  input: WatchCheckInput
): Promise<Outcome<WatchCheckResult>> {
  const toolContext = {
    runIdentifier: input.watchId,
    nodeName: "watch-check",
    agentName: null,
  };

  const reportsOutcome = await findRecentReports.run(
    { documentId: input.documentId, limit: 2 },
    toolContext
  );

  if (!reportsOutcome.successful) {
    return fail(
      "database-error",
      `Stored reports could not be read: ${reportsOutcome.failure.message}`
    );
  }

  const stored = reportsOutcome.value.reports;

  if (stored.length < 2) {
    return succeed({
      watchCheckId: null,
      importance: "none",
      shouldNotify: false,
      explanation:
        "Only one check exists for this paper so far. There is nothing yet to compare it against.",
      changes: [],
      nextCheckAt: null,
    });
  }

  const current = stored[0];
  const previous = stored[1];

  const difference = compareReports(previous.report, current.report);

  if (!difference.hasAnyDifference) {
    return await storeResult(input, previous.reportId, current.reportId, {
      importance: "none",
      shouldNotify: false,
      explanation: "Nothing of substance has changed since the last check.",
      changes: [],
    });
  }

  const differenceSummary = describeDifference(
    difference,
    previous.report,
    current.report
  );

  const findOutcome = await runAgent(changeFinder, {
    runIdentifier: input.watchId,
    subject: current.report.paperTitle,
    userPrompt: [
      "Differences found by comparing the two stored reports:",
      differenceSummary,
      "",
      "Earlier summary:",
      previous.report.narrative,
      "",
      "Current summary:",
      current.report.narrative,
    ].join("\n"),
    writer: input.writer,
  });

  if (!findOutcome.successful) {
    return fail(
      "upstream-error",
      `The changes could not be described: ${findOutcome.failure.message}`
    );
  }

  const changes = findOutcome.value.output.changes;

  if (changes.length === 0) {
    return await storeResult(input, previous.reportId, current.reportId, {
      importance: "none",
      shouldNotify: false,
      explanation:
        "The differences found were only in wording, not in what the evidence shows.",
      changes: [],
    });
  }

  const rateOutcome = await runAgent(changeRater, {
    runIdentifier: input.watchId,
    subject: current.report.paperTitle,
    userPrompt: [
      `Paper: ${current.report.paperTitle}`,
      "",
      "Its main claims:",
      describeClaims(
        current.report.claims.filter(
          (claim) => claim.kind === "conclusion" || claim.kind === "finding"
        )
      ),
      "",
      "Changes found since the last check:",
      changes
        .map(
          (change) =>
            `${change.kind}: ${change.headline}. Was ${change.previousValue ?? "not present"}, now ${change.currentValue ?? "not present"}. Cause: ${change.cause}`
        )
        .join("\n"),
    ].join("\n"),
    writer: input.writer,
  });

  if (!rateOutcome.successful) {
    return await storeResult(input, previous.reportId, current.reportId, {
      importance: "medium",
      shouldNotify: true,
      explanation:
        "Changes were found but could not be rated for importance, so this is being surfaced to be safe.",
      changes,
    });
  }

  const rating = rateOutcome.value.output;

  const meetsThreshold =
    importanceRank[rating.importance] >= importanceRank[input.notifyFrom];

  return await storeResult(input, previous.reportId, current.reportId, {
    importance: rating.importance,
    shouldNotify: rating.shouldNotify && meetsThreshold,
    explanation: rating.explanation,
    changes,
  });
}

async function storeResult(
  input: WatchCheckInput,
  previousReportId: string,
  currentReportId: string,
  result: {
    importance: Importance;
    shouldNotify: boolean;
    explanation: string;
    changes: DetectedChange[];
  }
): Promise<Outcome<WatchCheckResult>> {
  const saveOutcome = await saveWatchCheck.run(
    {
      watchId: input.watchId,
      frequency: input.frequency,
      previousReportId,
      currentReportId,
      importance: result.importance,
      shouldNotify: result.shouldNotify,
      explanation: result.explanation,
      changes: result.changes,
    },
    {
      runIdentifier: input.watchId,
      nodeName: "watch-check",
      agentName: null,
    }
  );

  if (!saveOutcome.successful) {
    return fail(
      "database-error",
      `The check finished but could not be stored: ${saveOutcome.failure.message}`
    );
  }

  return succeed({
    watchCheckId: saveOutcome.value.watchCheckId,
    importance: result.importance,
    shouldNotify: result.shouldNotify,
    explanation: result.explanation,
    changes: result.changes,
    nextCheckAt: saveOutcome.value.nextCheckAt,
  });
}
