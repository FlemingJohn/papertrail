import type { LangGraphRunnableConfig } from "@langchain/langgraph";
import type { RunState, RunStateUpdate } from "../state";
import type { Claim } from "../../schemas/claim";
import type { PageLocation } from "../../schemas/document";
import { runAgent } from "../../agents/run-agent";
import { claimFinder } from "../../agents/definitions/claim-finder";
import { runDepthSettings } from "../../schemas/run";
import { announceStage, buildEventWriter, reportActivity } from "../writer";
import { describeIndexedBlocks } from "../context";
import { kindsForClaims, selectKinds, splitIntoSections } from "../sections";

const fallbackLocation: PageLocation = {
  pageNumber: 1,
  polygon: [0, 0, 0, 0, 0, 0, 0, 0],
};

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

  const indexed = splitIntoSections(state.document.textBlocks);
  const readable = selectKinds(indexed, kindsForClaims);
  const { text, locationByIndex } = describeIndexedBlocks(readable);

  const skippedCount = indexed.length - readable.length;

  if (skippedCount > 0) {
    reportActivity(
      writer,
      "info",
      `Skipped ${skippedCount} blocks of references and back matter`,
      "Those carry no checkable statements."
    );
  }

  const outcome = await runAgent(claimFinder, {
    runIdentifier: state.runIdentifier,
    subject: state.paperTitle,
    userPrompt: [
      `Paper title: ${state.paperTitle}`,
      "",
      "Blocks:",
      text,
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

  const claims: Claim[] = outcome.value.output.claims
    .slice(0, settings.maximumClaims)
    .map((draft, position) => ({
      identifier: normaliseIdentifier(draft.identifier, position),
      text: draft.text,
      kind: draft.kind,
      section: draft.section,
      citationMarkers: draft.citationMarkers,
      location: locationByIndex.get(draft.blockIndex) ?? fallbackLocation,
    }));

  const locatedCount = claims.filter(
    (claim) => claim.location !== fallbackLocation
  ).length;

  reportActivity(
    writer,
    "success",
    `Found ${claims.length} checkable statements`,
    `${claims.filter((claim) => claim.citationMarkers.length > 0).length} cite a source, ${locatedCount} located on the page`
  );

  return {
    claims,
    tokensIn: outcome.value.tokensIn,
    tokensOut: outcome.value.tokensOut,
  };
}

function normaliseIdentifier(candidate: string, position: number): string {
  return /^c\d+$/.test(candidate) ? candidate : `c${position + 1}`;
}
