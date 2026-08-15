import type { Claim } from "../schemas/claim";
import type { CitationCheck } from "../schemas/citation";
import type { RunEventWriter } from "../types/stream";
import { runAgent } from "../agents/run-agent";
import { sourceFinder } from "../agents/definitions/source-finder";
import { sourceChallenger } from "../agents/definitions/source-challenger";
import { sourceSupporter } from "../agents/definitions/source-supporter";
import { sourceJudge } from "../agents/definitions/source-judge";
import { sourceTracer } from "../agents/definitions/source-tracer";
import { readSourceText } from "../tools/external/read-source-text";

export interface CitationCheckInput {
  runIdentifier: string;
  claim: Claim;
  marker: string;
  rawReference: string;
  shouldTraceSources: boolean;
  writer: RunEventWriter;
}

export interface CitationCheckOutput {
  check: CitationCheck;
  tokensIn: number;
  tokensOut: number;
}

export async function checkOneCitation(
  input: CitationCheckInput
): Promise<CitationCheckOutput> {
  let tokensIn = 0;
  let tokensOut = 0;

  const findOutcome = await runAgent(sourceFinder, {
    runIdentifier: input.runIdentifier,
    subject: `${input.claim.identifier} ${input.marker}`,
    userPrompt: `Reference text:\n${input.rawReference}`,
    writer: input.writer,
  });

  if (findOutcome.successful) {
    tokensIn += findOutcome.value.tokensIn;
    tokensOut += findOutcome.value.tokensOut;
  }

  const lookup = findOutcome.successful ? findOutcome.value.output : null;
  const resolvedSource = lookup?.source ?? null;

  if (lookup === null || !lookup.wasFound || resolvedSource === null) {
    return {
      check: buildUnresolvedCheck(
        input,
        lookup?.note ?? "The source lookup did not complete."
      ),
      tokensIn,
      tokensOut,
    };
  }

  if (resolvedSource.isRetracted) {
    return {
      check: {
        claimIdentifier: input.claim.identifier,
        marker: input.marker,
        rawReference: input.rawReference,
        resolvedSource,
        challengerArgument: null,
        supporterArgument: null,
        judgement: {
          verdict: "retracted",
          confidence: 1,
          reasoning: `This source was retracted${resolvedSource.retractionDate === null ? "" : ` on ${resolvedSource.retractionDate}`}. Anything resting on it no longer stands.`,
          quotedEvidence: null,
        },
        trace: null,
      },
      tokensIn,
      tokensOut,
    };
  }

  const sourceTextOutcome = await readSourceText.run(
    { digitalObjectIdentifier: resolvedSource.digitalObjectIdentifier ?? "" },
    {
      runIdentifier: input.runIdentifier,
      nodeName: "checking-citations",
      agentName: null,
    }
  );

  const sourceText = sourceTextOutcome.successful
    ? sourceTextOutcome.value.text
    : (resolvedSource.abstract ?? "");

  if (sourceText.trim().length === 0) {
    return {
      check: {
        claimIdentifier: input.claim.identifier,
        marker: input.marker,
        rawReference: input.rawReference,
        resolvedSource,
        challengerArgument: null,
        supporterArgument: null,
        judgement: {
          verdict: "could-not-check",
          confidence: 0.9,
          reasoning:
            "The source exists but its text could not be read, so this citation is unverified rather than wrong.",
          quotedEvidence: null,
        },
        trace: null,
      },
      tokensIn,
      tokensOut,
    };
  }

  const argumentPrompt = [
    `Statement from the paper: ${input.claim.text}`,
    `Citation marker: ${input.marker}`,
    "",
    `Cited source: ${resolvedSource.title} (${resolvedSource.publicationYear ?? "year unknown"})`,
    "",
    "Source text:",
    sourceText,
  ].join("\n");

  const [challengeOutcome, supportOutcome] = await Promise.all([
    runAgent(sourceChallenger, {
      runIdentifier: input.runIdentifier,
      subject: input.claim.identifier,
      userPrompt: argumentPrompt,
      writer: input.writer,
    }),
    runAgent(sourceSupporter, {
      runIdentifier: input.runIdentifier,
      subject: input.claim.identifier,
      userPrompt: argumentPrompt,
      writer: input.writer,
    }),
  ]);

  if (challengeOutcome.successful) {
    tokensIn += challengeOutcome.value.tokensIn;
    tokensOut += challengeOutcome.value.tokensOut;
  }
  if (supportOutcome.successful) {
    tokensIn += supportOutcome.value.tokensIn;
    tokensOut += supportOutcome.value.tokensOut;
  }

  const challengerArgument = challengeOutcome.successful
    ? challengeOutcome.value.output
    : null;
  const supporterArgument = supportOutcome.successful
    ? supportOutcome.value.output
    : null;

  const judgeOutcome = await runAgent(sourceJudge, {
    runIdentifier: input.runIdentifier,
    subject: input.claim.identifier,
    userPrompt: [
      argumentPrompt,
      "",
      "Argument that the citation does not hold:",
      challengerArgument?.position ?? "No argument was produced.",
      challengerArgument?.quotedEvidence ?? "",
      "",
      "Argument that the citation holds:",
      supporterArgument?.position ?? "No argument was produced.",
      supporterArgument?.quotedEvidence ?? "",
    ].join("\n"),
    writer: input.writer,
  });

  if (!judgeOutcome.successful) {
    return {
      check: buildUnresolvedCheck(
        input,
        "The judgement step failed, so this citation is unverified.",
        resolvedSource
      ),
      tokensIn,
      tokensOut,
    };
  }

  tokensIn += judgeOutcome.value.tokensIn;
  tokensOut += judgeOutcome.value.tokensOut;

  const judgement = judgeOutcome.value.output;

  const shouldTrace =
    input.shouldTraceSources &&
    (judgement.verdict === "indirect-source" ||
      judgement.verdict === "wrong-source" ||
      judgement.verdict === "not-supported");

  let trace = null;

  if (shouldTrace && resolvedSource.digitalObjectIdentifier !== null) {
    const traceOutcome = await runAgent(sourceTracer, {
      runIdentifier: input.runIdentifier,
      subject: input.claim.identifier,
      userPrompt: [
        `Statement: ${input.claim.text}`,
        `Cited paper DOI: ${resolvedSource.digitalObjectIdentifier}`,
        `Cited paper title: ${resolvedSource.title}`,
      ].join("\n"),
      writer: input.writer,
    });

    if (traceOutcome.successful) {
      trace = traceOutcome.value.output;
      tokensIn += traceOutcome.value.tokensIn;
      tokensOut += traceOutcome.value.tokensOut;
    }
  }

  return {
    check: {
      claimIdentifier: input.claim.identifier,
      marker: input.marker,
      rawReference: input.rawReference,
      resolvedSource,
      challengerArgument,
      supporterArgument,
      judgement,
      trace,
    },
    tokensIn,
    tokensOut,
  };
}

function buildUnresolvedCheck(
  input: CitationCheckInput,
  reasoning: string,
  resolvedSource: CitationCheck["resolvedSource"] = null
): CitationCheck {
  return {
    claimIdentifier: input.claim.identifier,
    marker: input.marker,
    rawReference: input.rawReference,
    resolvedSource,
    challengerArgument: null,
    supporterArgument: null,
    judgement: {
      verdict: resolvedSource === null ? "source-not-found" : "could-not-check",
      confidence: 0.8,
      reasoning,
      quotedEvidence: null,
    },
    trace: null,
  };
}
