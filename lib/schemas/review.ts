import { z } from "zod";
import { severityLevelSchema } from "./verdict";

export const reviewAngleSchema = z.enum([
  "statistics",
  "originality",
  "method",
  "evidence",
]);

export type ReviewAngle = z.infer<typeof reviewAngleSchema>;

export const rebuttalDifficultySchema = z.enum(["easy", "moderate", "hard"]);

export type RebuttalDifficulty = z.infer<typeof rebuttalDifficultySchema>;

export const reviewPointSchema = z.object({
  angle: reviewAngleSchema,
  severity: severityLevelSchema,
  summary: z.string().max(200),
  detail: z.string().max(700),
  affectedClaimIdentifiers: z.array(z.string()),
  rebuttalDifficulty: rebuttalDifficultySchema,
});

export type ReviewPoint = z.infer<typeof reviewPointSchema>;

export const reviewPointListSchema = z.object({
  points: z.array(reviewPointSchema),
});

export type ReviewPointList = z.infer<typeof reviewPointListSchema>;

export const reviewOutcomeSchema = z.enum([
  "accept",
  "minor-revision",
  "major-revision",
  "reject",
]);

export type ReviewOutcome = z.infer<typeof reviewOutcomeSchema>;

export const reviewSummarySchema = z.object({
  outcome: reviewOutcomeSchema,
  headline: z.string().max(300),
  points: z.array(reviewPointSchema),
});

export type ReviewSummary = z.infer<typeof reviewSummarySchema>;
