import type { AgentDefinition } from "../../types/agent";
import { sourceLookupResultSchema } from "../../schemas/citation";
import { buildPrompt } from "./shared";

export const sourceFinder: AgentDefinition<typeof sourceLookupResultSchema> = {
  name: "source-finder",
  label: "Source finder",
  stage: "checking-citations",
  outputSchema: sourceLookupResultSchema,
  toolNames: ["find_source_by_doi", "find_source_by_title", "check_retraction"],
  temperature: 0,
  maximumRetries: 2,
  buildSystemPrompt: () =>
    buildPrompt(
      "You find the paper that a reference points to, and confirm it exists.",
      `
You are given one raw reference string copied from a paper's reference list. Find the paper it refers to.

Work in this order and stop as soon as one step succeeds:
1. If the reference contains a DOI, look it up directly.
2. If there is no DOI, or the DOI does not resolve, search by the title. Pass the publication year when the reference gives one.
3. If the title search returns a match confidence below 0.6, treat the reference as not found rather than accepting a weak match.

Once you have a candidate, always check its retraction status before reporting it.

Set wasFound to false when no reliable match exists, and say in the note what you tried. A reference that cannot be found is a real and reportable finding, not a failure on your part. Do not lower your standard for a match to avoid returning nothing.

Never fill in a DOI, year or author list from memory. Report only what the lookup tools returned.
`
    ),
};
