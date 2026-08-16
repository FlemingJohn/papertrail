import type { Report } from "../schemas/report";
import type { RunDepth } from "../schemas/run";
import type { RunEvent } from "../types/stream";
import type { ParsedDocument } from "../schemas/document";
import { buildGraph } from "../graph";
import { buildInitialState, type RunState } from "../graph/state";
import { buildReport } from "../graph/build-report";
import { calculateModelDollars } from "../config/pricing";

export interface ExecuteRunInput {
  runIdentifier: string;
  documentIdentifier: string;
  paperTitle: string;
  base64Source: string;
  cachedDocument: ParsedDocument | null;
  depth: RunDepth;
  comparisonPaperLimit: number;
  shouldTraceSources: boolean;
  shouldRunReview: boolean;
}

export interface RunOutcomeMessage {
  event: RunEvent;
  report: Report | null;
  extracted?: ParsedDocument | null;
}

export async function* executeRun(
  input: ExecuteRunInput
): AsyncGenerator<RunOutcomeMessage> {
  const graph = buildGraph();
  const startedAt = Date.now();
  const initialState = buildInitialState(input);

  let latestState: RunState = initialState;
  let runningTokensIn = 0;
  let runningTokensOut = 0;
  let activeAgentCount = 0;

  try {
    const stream = await graph.stream(initialState, {
      streamMode: ["custom", "values"],
      recursionLimit: 60,
    });

    for await (const [mode, chunk] of stream) {
      if (mode === "custom") {
        const event = chunk as RunEvent;

        if (event.type === "agent-started") {
          activeAgentCount += 1;
        }

        if (event.type === "agent-finished") {
          activeAgentCount = Math.max(0, activeAgentCount - 1);
        }

        yield { event, report: null };
        continue;
      }

      const state = chunk as RunState;
      latestState = state;

      if (
        state.tokensIn !== runningTokensIn ||
        state.tokensOut !== runningTokensOut
      ) {
        runningTokensIn = state.tokensIn;
        runningTokensOut = state.tokensOut;

        yield {
          event: {
            type: "spend-updated",
            totalDollars: calculateModelDollars(
              runningTokensIn,
              runningTokensOut
            ),
            tokensIn: runningTokensIn,
            tokensOut: runningTokensOut,
            activeAgentCount,
          },
          report: null,
        };
      }
    }
  } catch (error) {
    yield {
      event: {
        type: "run-failed",
        runIdentifier: input.runIdentifier,
        message:
          error instanceof Error
            ? error.message
            : "The analysis stopped unexpectedly.",
        isRecoverable: false,
      },
      report: null,
    };
    return;
  }

  const report = buildReport(latestState);

  yield {
    event: {
      type: "run-finished",
      runIdentifier: input.runIdentifier,
      status: report.limitations.length > 0 ? "finished-with-gaps" : "finished",
      durationMilliseconds: Date.now() - startedAt,
    },
    report,
    extracted: latestState.document,
  };
}
