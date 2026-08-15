import { z } from "zod";
import { confidenceLevelSchema, confidenceReasonSchema } from "./verdict";

export const claimConfidenceSchema = z.object({
  claimIdentifier: z.string(),
  level: confidenceLevelSchema,
  reasons: z.array(confidenceReasonSchema),
  explanation: z.string().max(400),
});

export type ClaimConfidence = z.infer<typeof claimConfidenceSchema>;

export const claimConfidenceListSchema = z.object({
  ratings: z.array(claimConfidenceSchema),
});

export type ClaimConfidenceList = z.infer<typeof claimConfidenceListSchema>;
