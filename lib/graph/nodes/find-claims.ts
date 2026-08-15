import type { LangGraphRunnableConfig } from "@langchain/langgraph";
import type { RunState, RunStateUpdate } from "../state";
import { runAgent } from "../../agents/run-agent";
import { claimFinder } from "../../agents/definitions/claim-finder";
import { runDepthSettings } from "../../schemas/run";
import { announceStage, buildEventWriter, reportActivity } from "../writer";
import { describeBlocks } from "../context";

export async function findClaims(
  state: RunState,
  config: LangGraphRunnableConfig
): Promise<RunStateUpdate> {
  const writer = buildEventWriter(config);
  announceStage(writer, "finding-claims");

  if (state.document === null) {
    throw new Error("The paper must be read before claims can be found.");
  }

  const settings = runDepthSettings[state.depth];

  const outcome = await runAgent(claimFinder, {
    runIdentifier: state.runIdentifier,
    subject: state.paperTitle,
    userPrompt: [
      `Paper title: ${state.paperTitle}`,
      "",
      "Text blocks, each with the page and position you must copy exactly:",
      describeBlocks(state.document.textBlocks),
      "",
      `Return at most ${settings.maximumClaims} statements, choosing the most checkable ones if there are more.`,
    ].join("\n"),
    writer,
  });

  if (!outcome.successful) {
    throw new Error(
      `Claims could not be identified: ${outcome.failure.message}`
    );
  }

  const claims = outcome.value.output.claims.slice(0, settings.maximumClaims);

  reportActivity(
    writer,
    "success",
    `Found ${claims.length} checkable statements`,
    `${claims.filter((claim) => claim.citationMarkers.length > 0).length} of them cite a source`
  );

  return {
    claims,
    tokensIn: outcome.value.tokensIn,
    tokensOut: outcome.value.tokensOut,
  };
}
