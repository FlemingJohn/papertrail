import { z } from "zod";
import { severityLevelSchema } from "./verdict";

export const methodStepSchema = z.object({
  order: z.number().int().positive(),
  action: z.string(),
  materials: z.array(z.string()),
  settings: z.array(z.string()),
});

export type MethodStep = z.infer<typeof methodStepSchema>;

export const methodProtocolSchema = z.object({
  summary: z.string().max(600),
  steps: z.array(methodStepSchema),
  assumptions: z.array(z.string()),
  evaluationCriteria: z.array(z.string()),
});

export type MethodProtocol = z.infer<typeof methodProtocolSchema>;

export const missingDetailCategorySchema = z.enum([
  "sample-selection",
  "group-assignment",
  "blinding",
  "materials",
  "equipment-settings",
  "environment",
  "statistical-analysis",
  "data-availability",
]);

export type MissingDetailCategory = z.infer<typeof missingDetailCategorySchema>;

export const missingDetailSchema = z.object({
  category: missingDetailCategorySchema,
  description: z.string().max(300),
  severity: severityLevelSchema,
  questionForAuthors: z.string().max(300),
});

export type MissingDetail = z.infer<typeof missingDetailSchema>;

export const missingDetailListSchema = z.object({
  missingDetails: z.array(missingDetailSchema),
});

export type MissingDetailList = z.infer<typeof missingDetailListSchema>;
