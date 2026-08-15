import type { LangGraphRunnableConfig } from "@langchain/langgraph";
import type { RunState, RunStateUpdate } from "../state";
import type { ReviewPoint } from "../../schemas/review";
import { runAgent } from "../../agents/run-agent";
import { reviewStatistics } from "../../agents/definitions/review-statistics";
import { reviewOriginality } from "../../agents/definitions/review-originality";
import { reviewMethod } from "../../agents/definitions/review-method";
import { reviewEvidence } from "../../agents/definitions/review-evidence";
import { reviewSummary } from "../../agents/definitions/review-summary";
import { announceStage, buildEventWriter, reportActivity } from "../writer";
import {
  describeCitationChecks,
  describeClaims,
  describeConflicts,
  describeMeasurements,
  describeMissingDetails,
  describePapers,
  describeReviewPoints,
} from "../context";

export async function reviewPaper(
  state: RunState,
  config: LangGraphRunnableConfig
): Promise<RunStateUpdate> {
  const writer = buildEventWriter(config);
  announceStage(writer, "reviewing");

  if (!state.shouldRunReview) {
    reportActivity(
      writer,
      "info",
      "Skipping review",
      "This run was set to check facts only."
    );
    return {};
  }

  const claimSummary = describeClaims(state.claims);

  const [statisticsOutcome, originalityOutcome, methodOutcome, evidenceOutcome] =
    await Promise.all([
      runAgent(reviewStatistics, {
        runIdentifier: state.runIdentifier,
        subject: state.paperTitle,
        userPrompt: [
          `Paper title: ${state.paperTitle}`,
          "",
          "Claims:",
          claimSummary,
          "",
          "Numbers extracted from the paper:",
          describeMeasurements(state.measurements),
        ].join("\n"),
        writer,
      }),
      runAgent(reviewOriginality, {
        runIdentifier: state.runIdentifier,
        subject: state.paperTitle,
        userPrompt: [
          `Paper title: ${state.paperTitle}`,
          "",
          "Claimed contributions:",
          describeClaims(
            state.claims.filter((claim) => claim.kind === "conclusion")
          ),
          "",
          "Related papers already found:",
          describePapers(state.comparisonPapers),
        ].join("\n"),
        writer,
      }),
      runAgent(reviewMethod, {
        runIdentifier: state.runIdentifier,
        subject: state.paperTitle,
        userPrompt: [
          `Paper title: ${state.paperTitle}`,
          "",
          "Missing method details already identified:",
          describeMissingDetails(state.missingDetails),
        ].join("\n"),
        writer,
      }),
      runAgent(reviewEvidence, {
        runIdentifier: state.runIdentifier,
        subject: state.paperTitle,
        userPrompt: [
          `Paper title: ${state.paperTitle}`,
          "",
          "Claims:",
          claimSummary,
          "",
          "Citation verdicts:",
          describeCitationChecks(state.citationChecks),
          "",
          "Disagreements between studies:",
          describeConflicts(state.conflicts),
        ].join("\n"),
        writer,
      }),
    ]);

  const outcomes = [
    statisticsOutcome,
    originalityOutcome,
    methodOutcome,
    evidenceOutcome,
  ];

  const points: ReviewPoint[] = [];
  let tokensIn = 0;
  let tokensOut = 0;

  for (const outcome of outcomes) {
    if (!outcome.successful) {
      continue;
    }

    points.push(...outcome.value.output.points);
    tokensIn += outcome.value.tokensIn;
    tokensOut += outcome.value.tokensOut;
  }

  const failedLenses = outcomes.filter((outcome) => !outcome.successful).length;

  if (points.length === 0) {
    reportActivity(
      writer,
      "success",
      "No reviewer concerns raised",
      "All four reviewers came back clear."
    );
    return { tokensIn, tokensOut };
  }

  const summaryOutcome = await runAgent(reviewSummary, {
    runIdentifier: state.runIdentifier,
    subject: state.paperTitle,
    userPrompt: [
      `Paper title: ${state.paperTitle}`,
      "",
      "Points raised by the four reviewers:",
      describeReviewPoints(points),
    ].join("\n"),
    writer,
  });

  if (!summaryOutcome.successful) {
    return {
      reviewPoints: points,
      tokensIn,
      tokensOut,
      limitations: [
        {
          area: "Review",
          description:
            "The four reviews completed but could not be combined into a single outcome.",
        },
      ],
    };
  }

  const summary = summaryOutcome.value.output;

  reportActivity(
    writer,
    summary.outcome === "accept" ? "success" : "warning",
    `Review outcome: ${summary.outcome.replace(/-/g, " ")}`,
    summary.headline
  );

  return {
    reviewPoints: points,
    reviewSummary: summary,
    tokensIn: tokensIn + summaryOutcome.value.tokensIn,
    tokensOut: tokensOut + summaryOutcome.value.tokensOut,
    limitations:
      failedLenses > 0
        ? [
            {
              area: "Review",
              description: `${failedLenses} of the four review angles did not complete, so the review is incomplete.`,
            },
          ]
        : [],
  };
}
