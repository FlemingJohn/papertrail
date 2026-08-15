import { z } from "zod";
import { claimSchema } from "./claim";
import { citationCheckSchema } from "./citation";
import { measurementSchema } from "./measurement";
import { methodProtocolSchema, missingDetailSchema } from "./method";
import { conflictSchema } from "./conflict";
import { reviewSummarySchema } from "./review";
import { claimConfidenceSchema } from "./confidence";
import { comparisonPaperSchema } from "./paper";

export const coverageSchema = z.object({
  claimsFound: z.number().int().nonnegative(),
  citationsChecked: z.number().int().nonnegative(),
  citationsUncheckable: z.number().int().nonnegative(),
  comparisonPapersUsed: z.number().int().nonnegative(),
  fullTextAvailable: z.number().int().nonnegative(),
});

export type Coverage = z.infer<typeof coverageSchema>;

export const spendSummarySchema = z.object({
  totalDollars: z.number(),
  tokensIn: z.number().int().nonnegative(),
  tokensOut: z.number().int().nonnegative(),
  documentPagesRead: z.number().int().nonnegative(),
  toolCallCount: z.number().int().nonnegative(),
  cacheHitCount: z.number().int().nonnegative(),
});

export type SpendSummary = z.infer<typeof spendSummarySchema>;

export const limitationSchema = z.object({
  area: z.string(),
  description: z.string(),
});

export type Limitation = z.infer<typeof limitationSchema>;

export const reportSchema = z.object({
  fingerprint: z.string(),
  paperTitle: z.string(),
  paperIdentifier: z.string().nullable(),
  pageCount: z.number().int().positive(),
  coverage: coverageSchema,
  claims: z.array(claimSchema),
  citationChecks: z.array(citationCheckSchema),
  measurements: z.array(measurementSchema),
  methodProtocol: methodProtocolSchema.nullable(),
  missingDetails: z.array(missingDetailSchema),
  conflicts: z.array(conflictSchema),
  review: reviewSummarySchema.nullable(),
  confidenceRatings: z.array(claimConfidenceSchema),
  comparisonPapers: z.array(comparisonPaperSchema),
  narrative: z.string(),
  spend: spendSummarySchema,
  limitations: z.array(limitationSchema),
});

export type Report = z.infer<typeof reportSchema>;

export const narrativeSchema = z.object({
  narrative: z.string().max(3000),
  limitations: z.array(limitationSchema),
});

export type Narrative = z.infer<typeof narrativeSchema>;
