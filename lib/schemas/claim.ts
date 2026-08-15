import { z } from "zod";
import { pageLocationSchema } from "./document";

export const claimKindSchema = z.enum([
  "finding",
  "background",
  "method",
  "conclusion",
]);

export type ClaimKind = z.infer<typeof claimKindSchema>;

export const claimSchema = z.object({
  identifier: z.string().regex(/^c\d+$/),
  text: z.string().min(1),
  kind: claimKindSchema,
  section: z.string().nullable(),
  citationMarkers: z.array(z.string()),
  location: pageLocationSchema,
});

export type Claim = z.infer<typeof claimSchema>;

export const claimListSchema = z.object({
  claims: z.array(claimSchema),
});

export type ClaimList = z.infer<typeof claimListSchema>;

export const claimDraftSchema = z.object({
  identifier: z.string(),
  text: z.string().min(1),
  kind: claimKindSchema,
  section: z.string().nullable(),
  citationMarkers: z.array(z.string()),
  blockIndex: z.number().int().nonnegative(),
});

export type ClaimDraft = z.infer<typeof claimDraftSchema>;

export const claimDraftListSchema = z.object({
  claims: z.array(claimDraftSchema),
});

export type ClaimDraftList = z.infer<typeof claimDraftListSchema>;
