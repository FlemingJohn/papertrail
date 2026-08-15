import type { LangGraphRunnableConfig } from "@langchain/langgraph";
import type { RunState, RunStateUpdate } from "../state";
import type { ComparisonPaper } from "../../schemas/paper";
import { runAgent } from "../../agents/run-agent";
import { searchPlanner } from "../../agents/definitions/search-planner";
import { paperPicker } from "../../agents/definitions/paper-picker";
import { findRelatedPapers } from "../../tools/external/find-related-papers";
import { announceStage, buildEventWriter, reportActivity } from "../writer";
import { describeClaims } from "../context";

export async function gatherPapers(
  state: RunState,
  config: LangGraphRunnableConfig
): Promise<RunStateUpdate> {
  const writer = buildEventWriter(config);
  announceStage(writer, "gathering-papers");

  if (state.comparisonPaperLimit === 0) {
    reportActivity(
      writer,
      "info",
      "Skipping comparison papers",
      "This run was set to check the paper on its own."
    );
    return {};
  }

  const planOutcome = await runAgent(searchPlanner, {
    runIdentifier: state.runIdentifier,
    subject: state.paperTitle,
    userPrompt: [
      `Paper title: ${state.paperTitle}`,
      "",
      "Main statements from the paper:",
      describeClaims(state.claims.filter((claim) => claim.kind === "finding")),
    ].join("\n"),
    writer,
  });

  if (!planOutcome.successful) {
    reportActivity(
      writer,
      "warning",
      "Could not plan the search",
      "Continuing without comparison papers."
    );
    return {
      limitations: [
        {
          area: "Comparison papers",
          description:
            "No search plan could be produced, so this paper was not compared against related work.",
        },
      ],
    };
  }

  const candidates: ComparisonPaper[] = [];

  for (const query of planOutcome.value.output.topicQueries) {
    const searchOutcome = await findRelatedPapers.run(
      { query, resultLimit: 8 },
      {
        runIdentifier: state.runIdentifier,
        nodeName: "gather-papers",
        agentName: null,
      }
    );

    if (!searchOutcome.successful) {
      reportActivity(
        writer,
        "warning",
        `Search failed for "${query}"`,
        searchOutcome.failure.message
      );
      continue;
    }

    writer.emit({
      type: "tool-used",
      toolName: findRelatedPapers.name,
      toolLabel: "Searching for related papers",
      agentName: null,
      status: "succeeded",
      servedFromCache: false,
    });

    candidates.push(...searchOutcome.value.papers);
  }

  const uniqueCandidates = removeDuplicates(candidates).filter(
    (paper) => paper.abstract !== null
  );

  if (uniqueCandidates.length === 0) {
    reportActivity(
      writer,
      "warning",
      "No comparable papers found",
      "Conflicts between studies cannot be checked."
    );
    return {
      limitations: [
        {
          area: "Comparison papers",
          description:
            "No related papers with readable abstracts were found, so disagreements between studies were not checked.",
        },
      ],
      tokensIn: planOutcome.value.tokensIn,
      tokensOut: planOutcome.value.tokensOut,
    };
  }

  const pickOutcome = await runAgent(paperPicker, {
    runIdentifier: state.runIdentifier,
    subject: `${uniqueCandidates.length} candidates`,
    userPrompt: [
      `Paper under review: ${state.paperTitle}`,
      "",
      "Candidates:",
      uniqueCandidates
        .map(
          (paper, index) =>
            `${paper.digitalObjectIdentifier ?? `paper-${index + 1}`} | ${paper.title} (${paper.publicationYear ?? "year unknown"})\n${paper.abstract ?? ""}`
        )
        .join("\n\n"),
      "",
      `Select at most ${state.comparisonPaperLimit}.`,
    ].join("\n"),
    writer,
  });

  const selected = selectPapers(
    uniqueCandidates,
    pickOutcome.successful ? pickOutcome.value.output.selectedIdentifiers : [],
    state.comparisonPaperLimit
  );

  reportActivity(
    writer,
    "success",
    `Selected ${selected.length} papers to compare against`,
    `from ${uniqueCandidates.length} candidates`
  );

  return {
    comparisonPapers: selected,
    tokensIn:
      planOutcome.value.tokensIn +
      (pickOutcome.successful ? pickOutcome.value.tokensIn : 0),
    tokensOut:
      planOutcome.value.tokensOut +
      (pickOutcome.successful ? pickOutcome.value.tokensOut : 0),
  };
}

function removeDuplicates(papers: ComparisonPaper[]): ComparisonPaper[] {
  const seenKeys = new Set<string>();
  const unique: ComparisonPaper[] = [];

  for (const paper of papers) {
    const key = paper.digitalObjectIdentifier ?? paper.title.toLowerCase();

    if (seenKeys.has(key)) {
      continue;
    }

    seenKeys.add(key);
    unique.push(paper);
  }

  return unique;
}

function selectPapers(
  candidates: ComparisonPaper[],
  selectedIdentifiers: string[],
  limit: number
): ComparisonPaper[] {
  if (selectedIdentifiers.length === 0) {
    return candidates.slice(0, limit);
  }

  const wanted = new Set(selectedIdentifiers);
  const chosen = candidates.filter(
    (paper, index) =>
      wanted.has(paper.digitalObjectIdentifier ?? "") ||
      wanted.has(`paper-${index + 1}`)
  );

  return (chosen.length > 0 ? chosen : candidates).slice(0, limit);
}
