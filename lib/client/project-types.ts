import type {
  ExcludedCitation,
  PriorArtEntry,
  ProposalComponent,
  ProposalMethod,
} from "@/lib/schemas/project";

export interface ProjectSummary {
  projectId: string;
  question: string;
  domain: string;
  paperTarget: number;
  stage: string;
  status: string;
  costDollars: number;
  createdAt: string;
}

export interface ProjectPaper {
  documentId: string;
  title: string;
  digitalObjectIdentifier: string | null;
  addedBy: string;
  reportId: string | null;
}

export interface ProjectGap {
  gapId: string;
  position: number;
  headline: string;
  evidence: string;
  support: string;
  decision: string;
}

export interface ProjectProposal {
  proposalId: string;
  position: number;
  title: string;
  summary: string;
  components: ProposalComponent[];
  noveltyVerdict: string;
  worksSearched: number;
  priorArt: PriorArtEntry[];
  priorArtNote: string | null;
  method: ProposalMethod | null;
  decision: string;
}

export interface ProjectDraftSummary {
  draftId: string;
  title: string;
  authorName: string;
  figureCount: number;
  tableCount: number;
  excludedCitations: ExcludedCitation[];
  createdAt: string;
}

export interface ProjectDetail {
  project: ProjectSummary;
  papers: ProjectPaper[];
  gaps: ProjectGap[];
  proposals: ProjectProposal[];
  drafts: ProjectDraftSummary[];
}

export interface ProjectDraft extends ProjectDraftSummary {
  proposalId: string | null;
  latex: string;
  bibtex: string;
  previewHtml: string;
}

export const supportLabels: Record<string, string> = {
  grounded: "The papers say this",
  inferred: "Read across the papers",
  speculative: "Not backed by the papers",
};

export const noveltyLabels: Record<string, string> = {
  "not-checked": "Not searched yet",
  "nothing-found": "Nothing overlapping found",
  "similar-work-exists": "Close work exists",
  "already-done": "Already done",
};

export const stageLabels: Record<string, string> = {
  "finding-papers": "Finding papers",
  "reading-papers": "Reading papers",
  "checking-papers": "Checking papers",
  "mapping-evidence": "Mapping what is settled",
  "finding-gaps": "Finding what is missing",
  "awaiting-gap-decision": "Waiting on you",
  proposing: "Making proposals",
  "checking-prior-art": "Searching for existing work",
  "awaiting-proposal-decision": "Waiting on you",
  "designing-method": "Designing the test",
  "awaiting-method-decision": "Waiting on you",
  drafting: "Writing the draft",
  finished: "Finished",
};
