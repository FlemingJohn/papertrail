import { z } from "zod";

export const runDepthSchema = z.enum(["quick", "standard", "deep"]);

export type RunDepth = z.infer<typeof runDepthSchema>;

export const runStatusSchema = z.enum([
  "queued",
  "running",
  "finished",
  "finished-with-gaps",
  "failed",
  "cancelled",
]);

export type RunStatus = z.infer<typeof runStatusSchema>;

export const runStageSchema = z.enum([
  "reading-paper",
  "finding-claims",
  "gathering-papers",
  "checking-citations",
  "checking-numbers",
  "checking-methods",
  "finding-conflicts",
  "reviewing",
  "writing-report",
  "mapping-evidence",
  "finding-gaps",
  "proposing",
  "checking-prior-art",
  "designing-method",
  "drafting",
]);

export type RunStage = z.infer<typeof runStageSchema>;

export const startRunRequestSchema = z.object({
  documentId: z.uuid(),
  depth: runDepthSchema.default("standard"),
  comparisonPaperLimit: z.number().int().min(0).max(10).default(5),
  traceSources: z.boolean().default(true),
  checkRetractions: z.boolean().default(true),
  runReview: z.boolean().default(true),
});

export type StartRunRequest = z.infer<typeof startRunRequestSchema>;

export const runDepthSettings: Record<
  RunDepth,
  { comparisonPaperLimit: number; maximumClaims: number; runReview: boolean }
> = {
  quick: { comparisonPaperLimit: 0, maximumClaims: 15, runReview: false },
  standard: { comparisonPaperLimit: 5, maximumClaims: 35, runReview: true },
  deep: { comparisonPaperLimit: 10, maximumClaims: 60, runReview: true },
};
