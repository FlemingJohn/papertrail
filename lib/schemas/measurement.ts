import { z } from "zod";
import { pageLocationSchema } from "./document";

export const measurementKindSchema = z.enum([
  "mean-difference",
  "odds-ratio",
  "hazard-ratio",
  "correlation",
  "percentage",
  "count",
  "other",
]);

export type MeasurementKind = z.infer<typeof measurementKindSchema>;

export const readingSchema = z.object({
  value: z.number().nullable(),
  kind: measurementKindSchema,
  sampleSize: z.number().int().positive().nullable(),
  errorRangeLow: z.number().nullable(),
  errorRangeHigh: z.number().nullable(),
  probabilityValue: z.number().nullable(),
  unit: z.string().nullable(),
  location: pageLocationSchema,
  confidence: z.number().min(0).max(1),
  notes: z.string().max(300),
});

export type Reading = z.infer<typeof readingSchema>;

export const readingListSchema = z.object({
  readings: z.array(readingSchema),
});

export type ReadingList = z.infer<typeof readingListSchema>;

export const agreementStatusSchema = z.enum([
  "both-agreed",
  "resolved-by-judge",
  "still-disputed",
  "only-one-reader-found-it",
]);

export type AgreementStatus = z.infer<typeof agreementStatusSchema>;

export const measurementSchema = z.object({
  claimIdentifier: z.string(),
  readerOne: readingSchema.nullable(),
  readerTwo: readingSchema.nullable(),
  agreedValue: readingSchema.nullable(),
  agreementScore: z.number().min(0).max(1),
  status: agreementStatusSchema,
  judgeReasoning: z.string().max(400).nullable(),
});

export type Measurement = z.infer<typeof measurementSchema>;

export const measurementJudgementSchema = z.object({
  agreedValue: readingSchema.nullable(),
  status: agreementStatusSchema,
  reasoning: z.string().max(400),
});

export type MeasurementJudgement = z.infer<typeof measurementJudgementSchema>;
