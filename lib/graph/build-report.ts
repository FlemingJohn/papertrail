import { createHash } from "node:crypto";
import type { Report } from "../schemas/report";
import type { RunState } from "./state";
import { calculateDocumentDollars, calculateModelDollars } from "../config/pricing";
import { summariseToolCalls } from "../tools/tool-log";
import { readUsage } from "../agents/usage-log";

export function buildReport(state: RunState): Report {
  const toolSummary = summariseToolCalls(state.runIdentifier);
  const measured = readUsage(state.runIdentifier);

  const tokensIn = measured.tokensIn > 0 ? measured.tokensIn : state.tokensIn;
  const tokensOut =
    measured.tokensOut > 0 ? measured.tokensOut : state.tokensOut;
  const cachedTokensIn = measured.cachedTokensIn;

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
    claims: keepFirstByKey(state.claims, (claim) => claim.identifier),
    citationChecks: keepFirstByKey(
      state.citationChecks,
      (check) => `${check.claimIdentifier}|${check.marker}`
    ),
    measurements: keepFirstByKey(
      state.measurements,
      (measurement) => measurement.claimIdentifier
    ),
    methodProtocol: state.methodProtocol,
    missingDetails: state.missingDetails,
    conflicts: state.conflicts,
    review: state.reviewSummary,
    confidenceRatings: keepFirstByKey(
      state.confidenceRatings,
      (rating) => rating.claimIdentifier
    ),
    comparisonPapers: state.comparisonPapers,
    narrative: state.narrative,
    spend: {
      totalDollars:
        calculateModelDollars(tokensIn, tokensOut, cachedTokensIn) +
        calculateDocumentDollars(state.documentPagesRead),
      tokensIn,
      tokensOut,
      cachedTokensIn,
      documentPagesRead: state.documentPagesRead,
      toolCallCount: toolSummary.totalCalls,
      cacheHitCount: toolSummary.cacheHits,
    },
    limitations: removeRepeatedLimitations(state.limitations),
  };

  return {
    ...report,
    fingerprint: fingerprintReport(report),
  };
}

function keepFirstByKey<Item>(
  items: Item[],
  readKey: (item: Item) => string
): Item[] {
  const seenKeys = new Set<string>();
  const kept: Item[] = [];

  for (const item of items) {
    const key = readKey(item);

    if (seenKeys.has(key)) {
      continue;
    }

    seenKeys.add(key);
    kept.push(item);
  }

  return kept;
}

function removeRepeatedLimitations(
  limitations: RunState["limitations"]
): RunState["limitations"] {
  const seenAreas = new Set<string>();
  const kept: RunState["limitations"] = [];

  for (const limitation of limitations) {
    const area = limitation.area.toLowerCase();

    if (seenAreas.has(area)) {
      continue;
    }

    seenAreas.add(area);
    kept.push(limitation);
  }

  return kept;
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
