import type { LangGraphRunnableConfig } from "@langchain/langgraph";
import type { RunState, RunStateUpdate } from "../state";
import type { PageLocation } from "../../schemas/document";
import type {
  Measurement,
  Reading,
  ReadingDraft,
} from "../../schemas/measurement";
import { runAgent } from "../../agents/run-agent";
import { numberReaderOne } from "../../agents/definitions/number-reader-one";
import { numberReaderTwo } from "../../agents/definitions/number-reader-two";
import { numberJudge } from "../../agents/definitions/number-judge";
import { announceStage, buildEventWriter, reportActivity } from "../writer";
import { describeClaims, describeIndexedBlocks, describeTables } from "../context";
import { kindsForNumbers, selectKinds, splitIntoSections } from "../sections";
import { mapWithLimit } from "../parallel";

const concurrentJudgements = 3;

const agreementThreshold = 0.95;

const fallbackLocation: PageLocation = {
  pageNumber: 1,
  polygon: [0, 0, 0, 0, 0, 0, 0, 0],
};

export async function checkNumbers(
  state: RunState,
  config: LangGraphRunnableConfig
): Promise<RunStateUpdate> {
  const writer = buildEventWriter(config);
  announceStage(writer, "checking-numbers");

  if (state.document === null) {
    return {};
  }

  const findingClaims = state.claims.filter(
    (claim) => claim.kind !== "background"
  );

  if (findingClaims.length === 0) {
    reportActivity(
      writer,
      "info",
      "No reported results to check",
      "The paper states no measurable findings."
    );
    return {};
  }

  const indexed = splitIntoSections(state.document.textBlocks);
  const resultBlocks = selectKinds(indexed, kindsForNumbers);
  const chosen = resultBlocks.length > 0 ? resultBlocks : indexed;
  const { text, locationByIndex } = describeIndexedBlocks(chosen);

  const readingPrompt = [
    `Paper title: ${state.paperTitle}`,
    "",
    "Statements that may carry a number:",
    describeClaims(findingClaims),
    "",
    "Blocks from the results and abstract:",
    text,
    "",
    "Tables:",
    describeTables(state.document.tables),
  ].join("\n");

  const [firstOutcome, secondOutcome] = await Promise.all([
    runAgent(numberReaderOne, {
      runIdentifier: state.runIdentifier,
      subject: state.paperTitle,
      userPrompt: readingPrompt,
      writer,
    }),
    runAgent(numberReaderTwo, {
      runIdentifier: state.runIdentifier,
      subject: state.paperTitle,
      userPrompt: readingPrompt,
      writer,
    }),
  ]);

  if (!firstOutcome.successful || !secondOutcome.successful) {
    reportActivity(
      writer,
      "warning",
      "Numbers could not be read independently",
      "Two-reader checking was skipped."
    );
    return {
      limitations: [
        {
          area: "Numbers",
          description:
            "The two independent readings did not both complete, so reported numbers were not cross-checked.",
        },
      ],
    };
  }

  const tokensIn = firstOutcome.value.tokensIn + secondOutcome.value.tokensIn;
  let tokensOut = firstOutcome.value.tokensOut + secondOutcome.value.tokensOut;

  function resolve(draft: ReadingDraft): Reading {
    return {
      value: draft.value,
      kind: draft.kind,
      sampleSize: draft.sampleSize,
      errorRangeLow: draft.errorRangeLow,
      errorRangeHigh: draft.errorRangeHigh,
      probabilityValue: draft.probabilityValue,
      unit: draft.unit,
      location:
        draft.blockIndex === null
          ? fallbackLocation
          : (locationByIndex.get(draft.blockIndex) ?? fallbackLocation),
      confidence: draft.confidence,
      notes: draft.notes,
    };
  }

  const firstByClaim = new Map(
    firstOutcome.value.output.readings.map((draft) => [
      draft.claimIdentifier,
      draft,
    ])
  );
  const secondByClaim = new Map(
    secondOutcome.value.output.readings.map((draft) => [
      draft.claimIdentifier,
      draft,
    ])
  );

  const claimIdentifiers = [
    ...new Set([...firstByClaim.keys(), ...secondByClaim.keys()]),
  ];

  const measurements = await mapWithLimit(
    claimIdentifiers,
    concurrentJudgements,
    async (claimIdentifier): Promise<Measurement> => {
      const firstDraft = firstByClaim.get(claimIdentifier) ?? null;
      const secondDraft = secondByClaim.get(claimIdentifier) ?? null;

      const readerOne = firstDraft === null ? null : resolve(firstDraft);
      const readerTwo = secondDraft === null ? null : resolve(secondDraft);

      const agreementScore =
        readerOne !== null && readerTwo !== null
          ? scoreAgreement(readerOne, readerTwo)
          : 0;

      if (
        readerOne !== null &&
        readerTwo !== null &&
        agreementScore >= agreementThreshold
      ) {
        return {
          claimIdentifier,
          readerOne,
          readerTwo,
          agreedValue: readerOne,
          agreementScore,
          status: "both-agreed",
          judgeReasoning: null,
        };
      }

      const judgeOutcome = await runAgent(numberJudge, {
        runIdentifier: state.runIdentifier,
        subject: claimIdentifier,
        userPrompt: [
          `Statement identifier: ${claimIdentifier}`,
          "",
          `Reader one recorded: ${JSON.stringify(firstDraft)}`,
          `Reader two recorded: ${JSON.stringify(secondDraft)}`,
        ].join("\n"),
        writer,
      });

      if (!judgeOutcome.successful) {
        return {
          claimIdentifier,
          readerOne,
          readerTwo,
          agreedValue: null,
          agreementScore,
          status: "still-disputed",
          judgeReasoning: "The judgement step did not complete.",
        };
      }

      tokensOut += judgeOutcome.value.tokensOut;

      return {
        claimIdentifier,
        readerOne,
        readerTwo,
        agreedValue: judgeOutcome.value.output.agreedValue,
        agreementScore,
        status: judgeOutcome.value.output.status,
        judgeReasoning: judgeOutcome.value.output.reasoning,
      };
    }
  );

  const disputed = measurements.filter(
    (measurement) => measurement.status === "still-disputed"
  ).length;

  const averageAgreement =
    measurements.length === 0
      ? 1
      : measurements.reduce(
          (total, measurement) => total + measurement.agreementScore,
          0
        ) / measurements.length;

  reportActivity(
    writer,
    disputed === 0 ? "success" : "warning",
    `Checked ${measurements.length} reported numbers`,
    `reader agreement ${averageAgreement.toFixed(2)}, ${disputed} still disputed`
  );

  return {
    measurements,
    tokensIn,
    tokensOut,
    limitations:
      disputed > 0
        ? [
            {
              area: "Numbers",
              description: `${disputed} numbers could not be resolved between the two readers and remain disputed.`,
            },
          ]
        : [],
  };
}

function scoreAgreement(first: Reading, second: Reading): number {
  const headlineMatches = valuesMatch(first.value, second.value);

  const supportingFields: Array<
    [number | string | null, number | string | null]
  > = [
    [first.sampleSize, second.sampleSize],
    [first.errorRangeLow, second.errorRangeLow],
    [first.errorRangeHigh, second.errorRangeHigh],
    [first.probabilityValue, second.probabilityValue],
    [first.kind, second.kind],
  ];

  let comparedCount = 0;
  let matchedCount = 0;

  for (const [left, right] of supportingFields) {
    if (left === null && right === null) {
      continue;
    }

    comparedCount += 1;

    if (typeof left === "number" && typeof right === "number") {
      if (valuesMatch(left, right)) {
        matchedCount += 1;
      }
      continue;
    }

    if (left === right) {
      matchedCount += 1;
    }
  }

  const supportingScore =
    comparedCount === 0 ? 1 : matchedCount / comparedCount;

  const combined = headlineMatches
    ? 0.6 + 0.4 * supportingScore
    : 0.4 * supportingScore;

  return Math.round(combined * 100) / 100;
}

function valuesMatch(left: number | null, right: number | null): boolean {
  if (left === null && right === null) {
    return true;
  }

  if (left === null || right === null) {
    return false;
  }

  const scale = Math.max(Math.abs(left), Math.abs(right), 1);
  return Math.abs(left - right) / scale < 0.02;
}
