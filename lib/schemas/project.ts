import { z } from "zod";

export const researchDomainSchema = z.enum([
  "machine-learning",
  "clinical",
  "biology",
  "physics",
  "other",
]);

export type ResearchDomain = z.infer<typeof researchDomainSchema>;

export const projectStageSchema = z.enum([
  "finding-papers",
  "reading-papers",
  "checking-papers",
  "mapping-evidence",
  "finding-gaps",
  "awaiting-gap-decision",
  "proposing",
  "checking-prior-art",
  "awaiting-proposal-decision",
  "designing-method",
  "awaiting-method-decision",
  "drafting",
  "finished",
]);

export type ProjectStage = z.infer<typeof projectStageSchema>;

export const supportLevelSchema = z.enum([
  "grounded",
  "inferred",
  "speculative",
]);

export type SupportLevel = z.infer<typeof supportLevelSchema>;

export const decisionSchema = z.enum(["pending", "accepted", "rejected"]);

export type Decision = z.infer<typeof decisionSchema>;

export const gapSchema = z.object({
  headline: z.string().max(200),
  evidence: z.string().max(600),
  support: supportLevelSchema,
});

export type Gap = z.infer<typeof gapSchema>;

export const gapListSchema = z.object({
  gaps: z.array(gapSchema),
});

export type GapList = z.infer<typeof gapListSchema>;

export const proposalComponentSchema = z.object({
  statement: z.string().max(240),
  support: supportLevelSchema,
  tracesTo: z.string().max(200),
});

export type ProposalComponent = z.infer<typeof proposalComponentSchema>;

export const proposalSchema = z.object({
  title: z.string().max(160),
  summary: z.string().max(700),
  components: z.array(proposalComponentSchema),
  searchPhrases: z.array(z.string()).min(1).max(4),
});

export type Proposal = z.infer<typeof proposalSchema>;

export const proposalListSchema = z.object({
  proposals: z.array(proposalSchema),
});

export type ProposalList = z.infer<typeof proposalListSchema>;

export const noveltyVerdictSchema = z.enum([
  "not-checked",
  "nothing-found",
  "similar-work-exists",
  "already-done",
]);

export type NoveltyVerdict = z.infer<typeof noveltyVerdictSchema>;

export const priorArtEntrySchema = z.object({
  title: z.string(),
  digitalObjectIdentifier: z.string().nullable(),
  publicationYear: z.number().int().nullable(),
  overlap: z.string().max(300),
});

export type PriorArtEntry = z.infer<typeof priorArtEntrySchema>;

export const priorArtVerdictSchema = z.object({
  verdict: noveltyVerdictSchema,
  worksSearched: z.number().int().nonnegative(),
  matches: z.array(priorArtEntrySchema),
  note: z.string().max(600),
});

export type PriorArtVerdict = z.infer<typeof priorArtVerdictSchema>;

export const proposalMethodSchema = z.object({
  steps: z.array(z.string().max(300)),
  whatIsMeasured: z.array(z.string().max(200)),
  whatWouldFalsifyIt: z.string().max(500),
  estimatedCost: z.string().max(300),
  isCostVerified: z.boolean(),
});

export type ProposalMethod = z.infer<typeof proposalMethodSchema>;

export const excludedCitationSchema = z.object({
  reference: z.string(),
  reason: z.string(),
});

export type ExcludedCitation = z.infer<typeof excludedCitationSchema>;

export const establishedClaimSchema = z.object({
  claim: z.string().max(240),
  paperCount: z.number().int().nonnegative(),
  verifiedCount: z.number().int().nonnegative(),
  strength: z.enum(["strong", "contested", "weak"]),
});

export type EstablishedClaim = z.infer<typeof establishedClaimSchema>;

export const evidenceMapSchema = z.object({
  established: z.array(establishedClaimSchema),
  note: z.string().max(500),
});

export type EvidenceMap = z.infer<typeof evidenceMapSchema>;

export const draftSectionsSchema = z.object({
  abstract: z.string().max(1200),
  whatIsEstablished: z.string().max(2500),
  whatIsContested: z.string().max(1800),
  theProposal: z.string().max(2500),
  howItWouldBeTested: z.string().max(2000),
  threats: z.string().max(1200),
});

export type DraftSections = z.infer<typeof draftSectionsSchema>;

export const startProjectSchema = z.object({
  question: z.string().min(12).max(300),
  domain: researchDomainSchema.default("other"),
  paperTarget: z.number().int().min(3).max(15).default(10),
});

export type StartProject = z.infer<typeof startProjectSchema>;
