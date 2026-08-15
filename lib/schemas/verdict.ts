import { z } from "zod";

export const citationVerdictSchema = z.enum([
  "supported",
  "partly-supported",
  "not-supported",
  "wrong-source",
  "indirect-source",
  "source-not-found",
  "retracted",
  "could-not-check",
]);

export type CitationVerdict = z.infer<typeof citationVerdictSchema>;

export const confidenceLevelSchema = z.enum([
  "high",
  "moderate",
  "low",
  "very-low",
]);

export type ConfidenceLevel = z.infer<typeof confidenceLevelSchema>;

export const confidenceReasonSchema = z.enum([
  "small-sample",
  "wide-error-range",
  "conflicting-studies",
  "indirect-evidence",
  "wrong-source",
  "retracted-source",
  "source-not-found",
  "method-unclear",
]);

export type ConfidenceReason = z.infer<typeof confidenceReasonSchema>;

export const severityLevelSchema = z.enum(["critical", "major", "minor"]);

export type SeverityLevel = z.infer<typeof severityLevelSchema>;

export const problemVerdicts: readonly CitationVerdict[] = [
  "not-supported",
  "wrong-source",
  "source-not-found",
  "retracted",
];

export function isProblemVerdict(verdict: CitationVerdict): boolean {
  return problemVerdicts.includes(verdict);
}
