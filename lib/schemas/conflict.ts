import { z } from "zod";

export const findingDirectionSchema = z.enum([
  "positive-effect",
  "no-effect",
  "negative-effect",
]);

export type FindingDirection = z.infer<typeof findingDirectionSchema>;

export const studyGroupSchema = z.object({
  label: z.string(),
  direction: findingDirectionSchema,
  studyIdentifiers: z.array(z.string()),
  combinedValue: z.number().nullable(),
  errorRangeLow: z.number().nullable(),
  errorRangeHigh: z.number().nullable(),
});

export type StudyGroup = z.infer<typeof studyGroupSchema>;

export const explanationSchema = z.object({
  differingFactor: z.string(),
  evidence: z.string().max(500),
  confidence: z.number().min(0).max(1),
});

export type Explanation = z.infer<typeof explanationSchema>;

export const explanationResultSchema = z.object({
  wasExplained: z.boolean(),
  explanation: explanationSchema.nullable(),
  note: z.string().max(400),
});

export type ExplanationResult = z.infer<typeof explanationResultSchema>;

export const conflictSchema = z.object({
  identifier: z.string(),
  question: z.string(),
  groups: z.array(studyGroupSchema),
  explanation: explanationSchema.nullable(),
  affectedClaimIdentifiers: z.array(z.string()),
});

export type Conflict = z.infer<typeof conflictSchema>;

export const conflictListSchema = z.object({
  conflicts: z.array(conflictSchema),
});

export type ConflictList = z.infer<typeof conflictListSchema>;
