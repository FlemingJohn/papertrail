import type { CitationVerdict } from "../schemas/verdict";
import { checkOneCitation } from "../graph/check-one-citation";
import { evaluationCases, type CaseKind, type EvaluationCase } from "./cases";

export interface CaseOutcome {
  identifier: string;
  kind: CaseKind;
  expected: CitationVerdict[];
  actual: CitationVerdict;
  isCorrect: boolean;
  confidence: number;
  reasoning: string;
  groundTruth: string;
  tokensIn: number;
  tokensOut: number;
}

export interface EvaluationSummary {
  outcomes: CaseOutcome[];
  correctCount: number;
  totalCount: number;
  byKind: Array<{ kind: CaseKind; correct: number; total: number }>;
  tokensIn: number;
  tokensOut: number;
}

export async function runEvaluation(
  onProgress?: (message: string) => void
): Promise<EvaluationSummary> {
  const outcomes: CaseOutcome[] = [];

  for (const testCase of evaluationCases) {
    onProgress?.(`checking ${testCase.identifier}`);

    const result = await checkOneCitation({
      runIdentifier: `evaluation-${testCase.identifier}`,
      claim: {
        identifier: "c1",
        text: testCase.claimText,
        kind: "finding",
        section: null,
        citationMarkers: ["[1]"],
        location: { pageNumber: 1, polygon: [0, 0, 0, 0, 0, 0, 0, 0] },
      },
      marker: "[1]",
      rawReference: testCase.rawReference,
      shouldTraceSources: false,
      writer: null,
    });

    const actual = result.check.judgement.verdict;

    outcomes.push({
      identifier: testCase.identifier,
      kind: testCase.kind,
      expected: testCase.acceptableVerdicts,
      actual,
      isCorrect: testCase.acceptableVerdicts.includes(actual),
      confidence: result.check.judgement.confidence,
      reasoning: result.check.judgement.reasoning,
      groundTruth: testCase.groundTruth,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
    });
  }

  const kinds = [...new Set(evaluationCases.map((entry) => entry.kind))];

  return {
    outcomes,
    correctCount: outcomes.filter((outcome) => outcome.isCorrect).length,
    totalCount: outcomes.length,
    byKind: kinds.map((kind) => ({
      kind,
      correct: outcomes.filter(
        (outcome) => outcome.kind === kind && outcome.isCorrect
      ).length,
      total: outcomes.filter((outcome) => outcome.kind === kind).length,
    })),
    tokensIn: outcomes.reduce((total, outcome) => total + outcome.tokensIn, 0),
    tokensOut: outcomes.reduce((total, outcome) => total + outcome.tokensOut, 0),
  };
}

export function describeCase(testCase: EvaluationCase): string {
  return `${testCase.identifier} (${testCase.kind}): expects ${testCase.acceptableVerdicts.join(" or ")}`;
}
