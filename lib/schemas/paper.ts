import { z } from "zod";

export const comparisonPaperSchema = z.object({
  digitalObjectIdentifier: z.string().nullable(),
  title: z.string(),
  publicationYear: z.number().int().nullable(),
  authors: z.array(z.string()),
  abstract: z.string().nullable(),
  fullText: z.string().nullable(),
  isRetracted: z.boolean(),
  source: z.enum(["reference-list", "cited-by", "topic-search"]),
});

export type ComparisonPaper = z.infer<typeof comparisonPaperSchema>;

export const searchPlanSchema = z.object({
  topicQueries: z.array(z.string()).min(1).max(5),
  reasoning: z.string().max(400),
});

export type SearchPlan = z.infer<typeof searchPlanSchema>;

export const paperSelectionSchema = z.object({
  selectedIdentifiers: z.array(z.string()),
  reasoning: z.string().max(400),
});

export type PaperSelection = z.infer<typeof paperSelectionSchema>;
