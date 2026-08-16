import { ReducedValue, StateSchema } from "@langchain/langgraph";
import { z } from "zod";
import type { ParsedDocument } from "../schemas/document";
import type { Claim } from "../schemas/claim";
import type { CitationCheck } from "../schemas/citation";
import type { Measurement } from "../schemas/measurement";
import type { MethodProtocol, MissingDetail } from "../schemas/method";
import type { Conflict } from "../schemas/conflict";
import type { ReviewPoint, ReviewSummary } from "../schemas/review";
import type { ClaimConfidence } from "../schemas/confidence";
import type { ComparisonPaper } from "../schemas/paper";
import type { Limitation } from "../schemas/report";
import type { RunDepth } from "../schemas/run";

function concatenate<Item>(current: Item[], incoming: Item[]): Item[] {
  return [...current, ...incoming];
}

function addNumbers(current: number, incoming: number): number {
  return current + incoming;
}

function mergeComparisonPapers(
  current: ComparisonPaper[],
  incoming: ComparisonPaper[]
): ComparisonPaper[] {
  const seenKeys = new Set(
    current.map((paper) => paper.digitalObjectIdentifier ?? paper.title)
  );
  const merged = [...current];

  for (const paper of incoming) {
    const key = paper.digitalObjectIdentifier ?? paper.title;

    if (seenKeys.has(key)) {
      continue;
    }

    seenKeys.add(key);
    merged.push(paper);
  }

  return merged;
}

export const runState = new StateSchema({
  runIdentifier: z.string(),
  documentIdentifier: z.string(),
  depth: z.custom<RunDepth>(),
  comparisonPaperLimit: z.number(),
  shouldTraceSources: z.boolean(),
  shouldRunReview: z.boolean(),

  paperTitle: z.string(),
  base64Source: z.string(),
  document: z.custom<ParsedDocument | null>(),

  claims: new ReducedValue(z.custom<Claim[]>(), {
    reducer: concatenate<Claim>,
  }),
  comparisonPapers: new ReducedValue(z.custom<ComparisonPaper[]>(), {
    reducer: mergeComparisonPapers,
  }),
  citationChecks: new ReducedValue(z.custom<CitationCheck[]>(), {
    reducer: concatenate<CitationCheck>,
  }),
  measurements: new ReducedValue(z.custom<Measurement[]>(), {
    reducer: concatenate<Measurement>,
  }),
  methodProtocol: z.custom<MethodProtocol | null>(),
  missingDetails: new ReducedValue(z.custom<MissingDetail[]>(), {
    reducer: concatenate<MissingDetail>,
  }),
  conflicts: new ReducedValue(z.custom<Conflict[]>(), {
    reducer: concatenate<Conflict>,
  }),
  reviewPoints: new ReducedValue(z.custom<ReviewPoint[]>(), {
    reducer: concatenate<ReviewPoint>,
  }),
  reviewSummary: z.custom<ReviewSummary | null>(),
  confidenceRatings: new ReducedValue(z.custom<ClaimConfidence[]>(), {
    reducer: concatenate<ClaimConfidence>,
  }),
  narrative: z.string(),
  limitations: new ReducedValue(z.custom<Limitation[]>(), {
    reducer: concatenate<Limitation>,
  }),

  tokensIn: new ReducedValue(z.number(), { reducer: addNumbers }),
  tokensOut: new ReducedValue(z.number(), { reducer: addNumbers }),
  documentPagesRead: new ReducedValue(z.number(), { reducer: addNumbers }),
});

export type RunState = typeof runState.State;

export type RunStateUpdate = typeof runState.Update;

export function buildInitialState(input: {
  runIdentifier: string;
  documentIdentifier: string;
  paperTitle: string;
  base64Source: string;
  cachedDocument: ParsedDocument | null;
  depth: RunDepth;
  comparisonPaperLimit: number;
  shouldTraceSources: boolean;
  shouldRunReview: boolean;
}): RunState {
  return {
    runIdentifier: input.runIdentifier,
    documentIdentifier: input.documentIdentifier,
    depth: input.depth,
    comparisonPaperLimit: input.comparisonPaperLimit,
    shouldTraceSources: input.shouldTraceSources,
    shouldRunReview: input.shouldRunReview,
    paperTitle: input.paperTitle,
    base64Source: input.base64Source,
    document: input.cachedDocument,
    claims: [],
    comparisonPapers: [],
    citationChecks: [],
    measurements: [],
    methodProtocol: null,
    missingDetails: [],
    conflicts: [],
    reviewPoints: [],
    reviewSummary: null,
    confidenceRatings: [],
    narrative: "",
    limitations: [],
    tokensIn: 0,
    tokensOut: 0,
    documentPagesRead: 0,
  };
}
