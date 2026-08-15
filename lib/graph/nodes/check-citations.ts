import type { LangGraphRunnableConfig } from "@langchain/langgraph";
import type { RunState, RunStateUpdate } from "../state";
import type { CitationCheck } from "../../schemas/citation";
import { isProblemVerdict } from "../../schemas/verdict";
import { announceStage, buildEventWriter, reportActivity } from "../writer";
import { mapWithLimit } from "../parallel";
import { checkOneCitation } from "../check-one-citation";

const concurrentCitationChecks = 4;

interface CitationTask {
  claimIdentifier: string;
  marker: string;
  rawReference: string;
}

export async function checkCitations(
  state: RunState,
  config: LangGraphRunnableConfig
): Promise<RunStateUpdate> {
  const writer = buildEventWriter(config);
  announceStage(writer, "checking-citations");

  if (state.document === null) {
    return {};
  }

  const referencesByMarker = new Map(
    state.document.references.map((reference) => [
      reference.marker,
      reference.rawText,
    ])
  );

  const tasks: CitationTask[] = [];
  const unmatchedMarkers: string[] = [];

  for (const claim of state.claims) {
    for (const marker of claim.citationMarkers) {
      for (const singleMarker of splitMarker(marker)) {
        const rawReference = referencesByMarker.get(singleMarker);

        if (rawReference === undefined) {
          unmatchedMarkers.push(`${claim.identifier} ${singleMarker}`);
          continue;
        }

        tasks.push({
          claimIdentifier: claim.identifier,
          marker: singleMarker,
          rawReference,
        });
      }
    }
  }

  if (tasks.length === 0) {
    reportActivity(
      writer,
      "warning",
      "No citations could be matched to the reference list",
      "Citation checking was skipped."
    );
    return {
      limitations: [
        {
          area: "Citations",
          description:
            "Citation markers in the text could not be matched to entries in the reference list, so no citations were checked.",
        },
      ],
    };
  }

  const claimsByIdentifier = new Map(
    state.claims.map((claim) => [claim.identifier, claim])
  );

  const results = await mapWithLimit(
    tasks,
    concurrentCitationChecks,
    async (task) => {
      const claim = claimsByIdentifier.get(task.claimIdentifier);

      if (claim === undefined) {
        return null;
      }

      try {
        return await checkOneCitation({
          runIdentifier: state.runIdentifier,
          claim,
          marker: task.marker,
          rawReference: task.rawReference,
          shouldTraceSources: state.shouldTraceSources,
          writer,
        });
      } catch (error) {
        reportActivity(
          writer,
          "warning",
          `Could not check ${task.claimIdentifier} ${task.marker}`,
          error instanceof Error ? error.message : String(error)
        );
        return null;
      }
    }
  );

  const completed = results.filter((result) => result !== null);
  const checks = completed.map((result) => result.check);

  reportProblems(checks, writer);

  const uncheckable = checks.filter(
    (check) =>
      check.judgement.verdict === "could-not-check" ||
      check.judgement.verdict === "source-not-found"
  ).length;

  return {
    citationChecks: checks,
    tokensIn: completed.reduce((total, result) => total + result.tokensIn, 0),
    tokensOut: completed.reduce((total, result) => total + result.tokensOut, 0),
    limitations: buildLimitations(uncheckable, checks.length, unmatchedMarkers),
  };
}

function splitMarker(marker: string): string[] {
  const inner = marker.replace(/[[\]]/g, "");

  if (!inner.includes(",")) {
    return [marker];
  }

  return inner
    .split(",")
    .map((part) => `[${part.trim()}]`)
    .filter((part) => part.length > 2);
}

function reportProblems(
  checks: CitationCheck[],
  writer: ReturnType<typeof buildEventWriter>
): void {
  const problems = checks.filter((check) =>
    isProblemVerdict(check.judgement.verdict)
  );

  const retracted = checks.filter(
    (check) => check.judgement.verdict === "retracted"
  );

  for (const check of retracted) {
    reportActivity(
      writer,
      "problem",
      `${check.claimIdentifier} rests on a retracted source`,
      check.resolvedSource?.title ?? check.rawReference
    );
  }

  reportActivity(
    writer,
    problems.length === 0 ? "success" : "warning",
    `Checked ${checks.length} citations`,
    `${problems.length} had problems`
  );
}

function buildLimitations(
  uncheckable: number,
  total: number,
  unmatchedMarkers: string[]
): RunStateUpdate["limitations"] {
  const limitations: NonNullable<RunStateUpdate["limitations"]> = [];

  if (uncheckable > 0) {
    limitations.push({
      area: "Citations",
      description: `${uncheckable} of ${total} citations could not be verified because the source text was unavailable. These are unverified, not wrong.`,
    });
  }

  if (unmatchedMarkers.length > 0) {
    limitations.push({
      area: "Citations",
      description: `${unmatchedMarkers.length} citation markers in the text had no matching entry in the reference list and were skipped.`,
    });
  }

  return limitations;
}
