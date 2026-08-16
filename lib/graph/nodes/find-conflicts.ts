import type { LangGraphRunnableConfig } from "@langchain/langgraph";
import type { RunState, RunStateUpdate } from "../state";
import type { Conflict } from "../../schemas/conflict";
import { runAgent } from "../../agents/run-agent";
import { conflictFinder } from "../../agents/definitions/conflict-finder";
import { conflictExplainer } from "../../agents/definitions/conflict-explainer";
import { announceStage, buildEventWriter, reportActivity } from "../writer";
import { describeClaims, describeMeasurements, describePapers } from "../context";
import { mapWithLimit } from "../parallel";

const minimumPapersForComparison = 2;

const concurrentExplanations = 2;

export async function findConflicts(
  state: RunState,
  config: LangGraphRunnableConfig
): Promise<RunStateUpdate> {
  const writer = buildEventWriter(config);
  announceStage(writer, "finding-conflicts");

  if (state.comparisonPapers.length < minimumPapersForComparison) {
    reportActivity(
      writer,
      "info",
      "Not enough comparison papers",
      `Disagreements between studies need at least ${minimumPapersForComparison} related papers.`
    );
    return {
      limitations: [
        {
          area: "Conflicts",
          description: `Only ${state.comparisonPapers.length} comparable papers were available, which is too few to assess disagreement between studies.`,
        },
      ],
    };
  }

  const findOutcome = await runAgent(conflictFinder, {
    runIdentifier: state.runIdentifier,
    subject: `${state.comparisonPapers.length} papers`,
    userPrompt: [
      `Paper under review: ${state.paperTitle}`,
      "",
      "Its findings:",
      describeClaims(
        state.claims.filter(
          (claim) => claim.kind === "finding" || claim.kind === "conclusion"
        )
      ),
      "",
      "Numbers extracted from it:",
      describeMeasurements(state.measurements),
      "",
      "Related papers:",
      describePapers(state.comparisonPapers),
    ].join("\n"),
    writer,
  });

  if (!findOutcome.successful) {
    reportActivity(
      writer,
      "warning",
      "Could not compare findings",
      findOutcome.failure.message
    );
    return {
      limitations: [
        {
          area: "Conflicts",
          description:
            "The comparison against related papers did not complete, so disagreements were not assessed.",
        },
      ],
    };
  }

  const foundConflicts = findOutcome.value.output.conflicts;

  if (foundConflicts.length === 0) {
    const withFullText = state.comparisonPapers.filter(
      (paper) => paper.fullText !== null
    ).length;

    const wasAbstractOnly = withFullText === 0;

    reportActivity(
      writer,
      wasAbstractOnly ? "warning" : "success",
      "No disagreements found",
      wasAbstractOnly
        ? `${state.comparisonPapers.length} papers were compared, but only their abstracts were readable`
        : `across ${state.comparisonPapers.length} related papers`
    );

    return {
      tokensIn: findOutcome.value.tokensIn,
      tokensOut: findOutcome.value.tokensOut,
      limitations: wasAbstractOnly
        ? [
            {
              area: "Conflicts",
              description: `Only abstracts were readable for all ${state.comparisonPapers.length} comparison papers, so findings could not be placed side by side. No disagreement was found, but that is weak evidence of agreement rather than strong evidence of it.`,
            },
          ]
        : [],
    };
  }

  let tokensOut = findOutcome.value.tokensOut;

  const explained = await mapWithLimit(
    foundConflicts,
    concurrentExplanations,
    async (conflict): Promise<Conflict> => {
      const explainOutcome = await runAgent(conflictExplainer, {
        runIdentifier: state.runIdentifier,
        subject: conflict.identifier,
        userPrompt: [
          `Question: ${conflict.question}`,
          "",
          "Groups that disagree:",
          JSON.stringify(conflict.groups, null, 2),
          "",
          "Study details:",
          describePapers(state.comparisonPapers),
        ].join("\n"),
        writer,
      });

      if (!explainOutcome.successful) {
        return conflict;
      }

      tokensOut += explainOutcome.value.tokensOut;

      return {
        ...conflict,
        explanation: explainOutcome.value.output.explanation,
      };
    }
  );

  const unexplained = explained.filter(
    (conflict) => conflict.explanation === null
  ).length;

  reportActivity(
    writer,
    "warning",
    `Found ${explained.length} disagreements between studies`,
    `${explained.length - unexplained} explained, ${unexplained} unexplained`
  );

  return {
    conflicts: explained,
    tokensIn: findOutcome.value.tokensIn,
    tokensOut,
  };
}
