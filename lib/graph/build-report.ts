import { createHash } from "node:crypto";
import type { Report } from "../schemas/report";
import type { RunState } from "./state";
import { calculateDocumentDollars, calculateModelDollars } from "../config/pricing";
import { summariseToolCalls } from "../tools/tool-log";

export function buildReport(state: RunState): Report {
  const toolSummary = summariseToolCalls(state.runIdentifier);

  const uncheckableCitations = state.citationChecks.filter(
    (check) =>
      check.judgement.verdict === "could-not-check" ||
      check.judgement.verdict === "source-not-found"
  ).length;

  const fullTextAvailable = state.comparisonPapers.filter(
    (paper) => paper.fullText !== null
  ).length;

  const report: Omit<Report, "fingerprint"> = {
    paperTitle: state.paperTitle,
    paperIdentifier: null,
    pageCount: state.document?.pageCount ?? 1,
    coverage: {
      claimsFound: state.claims.length,
      citationsChecked: state.citationChecks.length,
      citationsUncheckable: uncheckableCitations,
      comparisonPapersUsed: state.comparisonPapers.length,
      fullTextAvailable,
    },
    claims: state.claims,
    citationChecks: state.citationChecks,
    measurements: state.measurements,
    methodProtocol: state.methodProtocol,
    missingDetails: state.missingDetails,
    conflicts: state.conflicts,
    review: state.reviewSummary,
    confidenceRatings: state.confidenceRatings,
    comparisonPapers: state.comparisonPapers,
    narrative: state.narrative,
    spend: {
      totalDollars:
        calculateModelDollars(state.tokensIn, state.tokensOut) +
        calculateDocumentDollars(state.documentPagesRead),
      tokensIn: state.tokensIn,
      tokensOut: state.tokensOut,
      documentPagesRead: state.documentPagesRead,
      toolCallCount: toolSummary.totalCalls,
      cacheHitCount: toolSummary.cacheHits,
    },
    limitations: state.limitations,
  };

  return {
    ...report,
    fingerprint: fingerprintReport(report),
  };
}

function fingerprintReport(report: Omit<Report, "fingerprint">): string {
  const stableParts = {
    paperTitle: report.paperTitle,
    claims: report.claims.map((claim) => claim.identifier),
    verdicts: report.citationChecks.map((check) => ({
      claim: check.claimIdentifier,
      marker: check.marker,
      verdict: check.judgement.verdict,
    })),
    measurements: report.measurements.map((measurement) => ({
      claim: measurement.claimIdentifier,
      value: measurement.agreedValue?.value ?? null,
    })),
    conflicts: report.conflicts.map((conflict) => conflict.identifier),
    confidence: report.confidenceRatings.map((rating) => ({
      claim: rating.claimIdentifier,
      level: rating.level,
    })),
  };

  return createHash("sha256")
    .update(JSON.stringify(stableParts))
    .digest("hex")
    .slice(0, 32);
}
