import { z } from "zod";
import { citationVerdictSchema } from "./verdict";

export const sourceRoleSchema = z.enum(["original", "repeats-another-source"]);

export type SourceRole = z.infer<typeof sourceRoleSchema>;

export const sourceLinkSchema = z.object({
  digitalObjectIdentifier: z.string(),
  title: z.string(),
  role: sourceRoleSchema,
});

export type SourceLink = z.infer<typeof sourceLinkSchema>;

export const resolvedSourceSchema = z.object({
  digitalObjectIdentifier: z.string().nullable(),
  title: z.string(),
  publicationYear: z.number().int().nullable(),
  authors: z.array(z.string()),
  abstract: z.string().nullable(),
  isRetracted: z.boolean(),
  retractionDate: z.string().nullable(),
  retractionReason: z.string().nullable(),
  matchConfidence: z.number().min(0).max(1),
});

export type ResolvedSource = z.infer<typeof resolvedSourceSchema>;

export const sourceLookupResultSchema = z.object({
  wasFound: z.boolean(),
  source: resolvedSourceSchema.nullable(),
  note: z.string().max(300),
});

export type SourceLookupResult = z.infer<typeof sourceLookupResultSchema>;

export const argumentSchema = z.object({
  position: z.string().max(600),
  quotedEvidence: z.string().nullable(),
});

export type Argument = z.infer<typeof argumentSchema>;

export const citationJudgementSchema = z.object({
  verdict: citationVerdictSchema,
  confidence: z.number().min(0).max(1),
  reasoning: z.string().max(500),
  quotedEvidence: z.string().nullable(),
});

export type CitationJudgement = z.infer<typeof citationJudgementSchema>;

export const sourceTraceSchema = z.object({
  isOriginalSource: z.boolean(),
  chain: z.array(sourceLinkSchema),
  explanation: z.string().max(400),
});

export type SourceTrace = z.infer<typeof sourceTraceSchema>;

export const citationCheckSchema = z.object({
  claimIdentifier: z.string(),
  marker: z.string(),
  rawReference: z.string(),
  resolvedSource: resolvedSourceSchema.nullable(),
  challengerArgument: argumentSchema.nullable(),
  supporterArgument: argumentSchema.nullable(),
  judgement: citationJudgementSchema,
  trace: sourceTraceSchema.nullable(),
});

export type CitationCheck = z.infer<typeof citationCheckSchema>;
