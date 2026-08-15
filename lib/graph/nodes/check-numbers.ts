import type { LangGraphRunnableConfig } from "@langchain/langgraph";
import type { RunState, RunStateUpdate } from "../state";
import type { Measurement, Reading } from "../../schemas/measurement";
import { runAgent } from "../../agents/run-agent";
import { numberReaderOne } from "../../agents/definitions/number-reader-one";
import { numberReaderTwo } from "../../agents/definitions/number-reader-two";
import { numberJudge } from "../../agents/definitions/number-judge";
import { announceStage, buildEventWriter, reportActivity } from "../writer";
import { describeBlocks, describeClaims } from "../context";
import { mapWithLimit } from "../parallel";

const concurrentJudgements = 3;

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
    (claim) => claim.kind === "finding" || claim.kind === "conclusion"
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

  const readingPrompt = [
    `Paper title: ${state.paperTitle}`,
    "",
    "Statements that report a result:",
    describeClaims(findingClaims),
    "",
    "Paper text, with page and position on each block:",
    describeBlocks(state.document.textBlocks),
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

  const pairs = pairReadings(
    firstOutcome.value.output.readings,
    secondOutcome.value.output.readings,
    findingClaims.map((claim) => claim.identifier)
  );

  const measurements = await mapWithLimit(
    pairs,
    concurrentJudgements,
    async (pair) => {
      if (pair.readerOne !== null && pair.readerTwo !== null) {
        const agreementScore = scoreAgreement(pair.readerOne, pair.readerTwo);

        if (agreementScore >= 0.95) {
          return {
            claimIdentifier: pair.claimIdentifier,
            readerOne: pair.readerOne,
            readerTwo: pair.readerTwo,
            agreedValue: pair.readerOne,
            agreementScore,
            status: "both-agreed" as const,
            judgeReasoning: null,
          } satisfies Measurement;
        }
      }

      const judgeOutcome = await runAgent(numberJudge, {
        runIdentifier: state.runIdentifier,
        subject: pair.claimIdentifier,
        userPrompt: [
          `Statement identifier: ${pair.claimIdentifier}`,
          "",
          `Reader one recorded: ${JSON.stringify(pair.readerOne)}`,
          `Reader two recorded: ${JSON.stringify(pair.readerTwo)}`,
        ].join("\n"),
        writer,
      });

      if (!judgeOutcome.successful) {
        return {
          claimIdentifier: pair.claimIdentifier,
          readerOne: pair.readerOne,
          readerTwo: pair.readerTwo,
          agreedValue: null,
          agreementScore: 0,
          status: "still-disputed" as const,
          judgeReasoning: "The judgement step did not complete.",
        } satisfies Measurement;
      }

      tokensOut += judgeOutcome.value.tokensOut;

      return {
        claimIdentifier: pair.claimIdentifier,
        readerOne: pair.readerOne,
        readerTwo: pair.readerTwo,
        agreedValue: judgeOutcome.value.output.agreedValue,
        agreementScore:
          pair.readerOne !== null && pair.readerTwo !== null
            ? scoreAgreement(pair.readerOne, pair.readerTwo)
            : 0,
        status: judgeOutcome.value.output.status,
        judgeReasoning: judgeOutcome.value.output.reasoning,
      } satisfies Measurement;
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

interface ReadingPair {
  claimIdentifier: string;
  readerOne: Reading | null;
  readerTwo: Reading | null;
}

function pairReadings(
  firstReadings: Reading[],
  secondReadings: Reading[],
  claimIdentifiers: string[]
): ReadingPair[] {
  return claimIdentifiers
    .map((claimIdentifier, index) => ({
      claimIdentifier,
      readerOne: firstReadings[index] ?? null,
      readerTwo: secondReadings[index] ?? null,
    }))
    .filter((pair) => pair.readerOne !== null || pair.readerTwo !== null);
}

function scoreAgreement(first: Reading, second: Reading): number {
  let matches = 0;
  let compared = 0;

  const fields: Array<keyof Reading> = [
    "value",
    "sampleSize",
    "errorRangeLow",
    "errorRangeHigh",
    "probabilityValue",
    "kind",
  ];

  for (const field of fields) {
    const firstValue = first[field];
    const secondValue = second[field];

    if (firstValue === null && secondValue === null) {
      continue;
    }

    compared += 1;

    if (typeof firstValue === "number" && typeof secondValue === "number") {
      const scale = Math.max(Math.abs(firstValue), Math.abs(secondValue), 1);
      if (Math.abs(firstValue - secondValue) / scale < 0.02) {
        matches += 1;
      }
      continue;
    }

    if (firstValue === secondValue) {
      matches += 1;
    }
  }

  return compared === 0 ? 1 : Math.round((matches / compared) * 100) / 100;
}

function describeTables(
  tables: NonNullable<RunState["document"]>["tables"]
): string {
  return tables
    .map((table, index) => {
      const rows = new Map<number, string[]>();

      for (const cell of table.cells) {
        const row = rows.get(cell.rowIndex) ?? [];
        row[cell.columnIndex] = cell.text;
        rows.set(cell.rowIndex, row);
      }

      const rendered = [...rows.entries()]
        .sort((left, right) => left[0] - right[0])
        .map(([, columns]) => columns.join(" | "))
        .join("\n");

      return `Table ${index + 1} [page ${table.location.pageNumber}] ${table.caption ?? ""}\n${rendered}`;
    })
    .join("\n\n");
}
