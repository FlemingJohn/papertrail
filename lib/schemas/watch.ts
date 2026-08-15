import { z } from "zod";

export const changeKindSchema = z.enum([
  "source-retracted",
  "verdict-changed",
  "combined-result-shifted",
  "conflict-opened",
  "conflict-explained",
  "confidence-changed",
  "new-papers-found",
  "full-text-became-available",
]);

export type ChangeKind = z.infer<typeof changeKindSchema>;

export const importanceSchema = z.enum(["high", "medium", "low", "none"]);

export type Importance = z.infer<typeof importanceSchema>;

export const detectedChangeSchema = z.object({
  kind: changeKindSchema,
  headline: z.string().max(200),
  previousValue: z.string().nullable(),
  currentValue: z.string().nullable(),
  cause: z.string().max(400),
  affectedClaimIdentifiers: z.array(z.string()),
});

export type DetectedChange = z.infer<typeof detectedChangeSchema>;

export const detectedChangeListSchema = z.object({
  changes: z.array(detectedChangeSchema),
});

export type DetectedChangeList = z.infer<typeof detectedChangeListSchema>;

export const importanceRatingSchema = z.object({
  importance: importanceSchema,
  shouldNotify: z.boolean(),
  explanation: z.string().max(400),
});

export type ImportanceRating = z.infer<typeof importanceRatingSchema>;

export const watchFrequencySchema = z.enum(["weekly", "monthly", "quarterly"]);

export type WatchFrequency = z.infer<typeof watchFrequencySchema>;
