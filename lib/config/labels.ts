import type { CitationVerdict, ConfidenceLevel, ConfidenceReason, SeverityLevel } from "../schemas/verdict";
import type { RunStage } from "../schemas/run";
import type { ChangeKind, Importance } from "../schemas/watch";
import type { MissingDetailCategory } from "../schemas/method";
import type { ReviewAngle, ReviewOutcome } from "../schemas/review";
import type { AgreementStatus } from "../schemas/measurement";

export const citationVerdictLabels: Record<CitationVerdict, string> = {
  supported: "Supported",
  "partly-supported": "Partly supported",
  "not-supported": "Not supported",
  "wrong-source": "Wrong source",
  "indirect-source": "Indirect source",
  "source-not-found": "Source not found",
  retracted: "Retracted",
  "could-not-check": "Could not check",
};

export const citationVerdictDescriptions: Record<CitationVerdict, string> = {
  supported: "The cited paper says what this sentence claims it says.",
  "partly-supported": "The cited paper supports some but not all of this claim.",
  "not-supported": "The cited paper does not support this claim.",
  "wrong-source": "The number is right but the source or context is not.",
  "indirect-source": "This cites a paper that is itself quoting someone else.",
  "source-not-found": "No such paper could be found.",
  retracted: "The cited paper has been retracted.",
  "could-not-check": "The source could not be retrieved, so this is unverified.",
};

export const confidenceLevelLabels: Record<ConfidenceLevel, string> = {
  high: "High",
  moderate: "Moderate",
  low: "Low",
  "very-low": "Very low",
};

export const confidenceReasonLabels: Record<ConfidenceReason, string> = {
  "small-sample": "Small sample size",
  "wide-error-range": "Wide error range",
  "conflicting-studies": "Other studies disagree",
  "indirect-evidence": "Evidence is indirect",
  "wrong-source": "Cited the wrong source",
  "retracted-source": "Source was retracted",
  "source-not-found": "Source could not be found",
  "method-unclear": "Method is not fully described",
};

export const severityLabels: Record<SeverityLevel, string> = {
  critical: "Critical",
  major: "Major",
  minor: "Minor",
};

export const runStageLabels: Record<RunStage, string> = {
  "reading-paper": "Reading the paper",
  "finding-claims": "Finding claims",
  "gathering-papers": "Gathering related papers",
  "checking-citations": "Checking citations",
  "checking-numbers": "Checking numbers",
  "checking-methods": "Checking methods",
  "finding-conflicts": "Finding conflicts",
  reviewing: "Reviewing",
  "writing-report": "Writing the report",
};

export const orderedRunStages: readonly RunStage[] = [
  "reading-paper",
  "finding-claims",
  "gathering-papers",
  "checking-citations",
  "checking-numbers",
  "checking-methods",
  "finding-conflicts",
  "reviewing",
  "writing-report",
];

export const changeKindLabels: Record<ChangeKind, string> = {
  "source-retracted": "A cited source was retracted",
  "verdict-changed": "A citation verdict changed",
  "combined-result-shifted": "The combined result shifted",
  "conflict-opened": "A new disagreement appeared",
  "conflict-explained": "A disagreement was explained",
  "confidence-changed": "Confidence in a claim changed",
  "new-papers-found": "New related papers appeared",
  "full-text-became-available": "A source became freely readable",
};

export const importanceLabels: Record<Importance, string> = {
  high: "Important",
  medium: "Worth knowing",
  low: "Minor",
  none: "No change",
};

export const missingDetailCategoryLabels: Record<MissingDetailCategory, string> = {
  "sample-selection": "How subjects were chosen",
  "group-assignment": "How groups were assigned",
  blinding: "Whether assessors were blinded",
  materials: "Materials and reagents",
  "equipment-settings": "Equipment settings",
  environment: "Environmental conditions",
  "statistical-analysis": "Statistical analysis",
  "data-availability": "Where the data lives",
};

export const reviewAngleLabels: Record<ReviewAngle, string> = {
  statistics: "Statistics",
  originality: "Originality",
  method: "Method",
  evidence: "Evidence",
};

export const reviewOutcomeLabels: Record<ReviewOutcome, string> = {
  accept: "Accept",
  "minor-revision": "Minor revision",
  "major-revision": "Major revision",
  reject: "Reject",
};

export const agreementStatusLabels: Record<AgreementStatus, string> = {
  "both-agreed": "Both readers agreed",
  "resolved-by-judge": "Resolved by judge",
  "still-disputed": "Still disputed",
  "only-one-reader-found-it": "Only one reader found it",
};
