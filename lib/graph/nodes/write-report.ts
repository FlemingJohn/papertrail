import type { LangGraphRunnableConfig } from "@langchain/langgraph";
import type { RunState, RunStateUpdate } from "../state";
import { runAgent } from "../../agents/run-agent";
import { confidenceRater } from "../../agents/definitions/confidence-rater";
import { reportWriter } from "../../agents/definitions/report-writer";
import { announceStage, buildEventWriter, reportActivity } from "../writer";
import {
  describeCitationChecks,
  describeClaims,
  describeConflicts,
  describeMeasurements,
  describeMissingDetails,
} from "../context";

export async function writeReport(
  state: RunState,
  config: LangGraphRunnableConfig
): Promise<RunStateUpdate> {
  const writer = buildEventWriter(config);
  announceStage(writer, "writing-report");

  const evidenceSummary = [
    "Claims:",
    describeClaims(state.claims),
    "",
    "Citation verdicts:",
    describeCitationChecks(state.citationChecks),
    "",
    "Numbers and reader agreement:",
    describeMeasurements(state.measurements),
    "",
    "Missing method details:",
    describeMissingDetails(state.missingDetails),
    "",
    "Disagreements between studies:",
    describeConflicts(state.conflicts),
  ].join("\n");

  const ratingOutcome = await runAgent(confidenceRater, {
    runIdentifier: state.runIdentifier,
    subject: `${state.claims.length} claims`,
    userPrompt: evidenceSummary,
    writer,
  });

  const confidenceRatings = ratingOutcome.successful
    ? ratingOutcome.value.output.ratings
    : [];

  const narrativeOutcome = await runAgent(reportWriter, {
    runIdentifier: state.runIdentifier,
    subject: state.paperTitle,
    userPrompt: [
      `Paper title: ${state.paperTitle}`,
      "",
      evidenceSummary,
      "",
      "Confidence ratings:",
      confidenceRatings
        .map(
          (rating) =>
            `${rating.claimIdentifier}: ${rating.level} (${rating.reasons.join(", ")})`
        )
        .join("\n"),
      "",
      "Review outcome:",
      state.reviewSummary === null
        ? "No review was run."
        : `${state.reviewSummary.outcome}: ${state.reviewSummary.headline}`,
      "",
      "Known gaps in this check so far:",
      state.limitations
        .map((limitation) => `${limitation.area}: ${limitation.description}`)
        .join("\n"),
    ].join("\n"),
    writer,
  });

  if (!narrativeOutcome.successful) {
    reportActivity(
      writer,
      "warning",
      "Could not write the summary",
      "The findings are still available in full."
    );

    return {
      confidenceRatings,
      narrative:
        "The summary could not be written. The detailed findings below are complete and unaffected.",
      tokensIn: ratingOutcome.successful ? ratingOutcome.value.tokensIn : 0,
      tokensOut: ratingOutcome.successful ? ratingOutcome.value.tokensOut : 0,
    };
  }

  reportActivity(writer, "success", "Report written", null);

  return {
    confidenceRatings,
    narrative: narrativeOutcome.value.output.narrative,
    limitations: narrativeOutcome.value.output.limitations,
    tokensIn:
      (ratingOutcome.successful ? ratingOutcome.value.tokensIn : 0) +
      narrativeOutcome.value.tokensIn,
    tokensOut:
      (ratingOutcome.successful ? ratingOutcome.value.tokensOut : 0) +
      narrativeOutcome.value.tokensOut,
  };
}
