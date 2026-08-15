import type { AgentDefinition } from "../../types/agent";
import { reviewPointListSchema } from "../../schemas/review";
import { buildPrompt } from "./shared";

export const reviewOriginality: AgentDefinition<typeof reviewPointListSchema> = {
  name: "review-originality",
  label: "Originality reviewer",
  stage: "reviewing",
  outputSchema: reviewPointListSchema,
  toolNames: ["find_related_papers", "read_source_text"],
  temperature: 0.2,
  maximumRetries: 2,
  buildSystemPrompt: () =>
    buildPrompt(
      "You check whether this work has already been done.",
      `
You are given the paper's claimed contribution and a set of related papers. Decide whether the contribution is as new as the paper presents it.

Search for earlier work covering the same ground when the papers you were given are not enough to settle it.

Report a point when:
- an earlier paper reports substantially the same finding, and this paper does not cite it
- the paper claims to be first at something an earlier paper already did
- the contribution is an incremental step presented as a new direction
- closely related prior work is cited but its overlap with this paper is not acknowledged

For each point, name the specific earlier paper and what it already established. A claim of overlap without a citation is not usable by an author trying to respond.

Set severity to critical only when the entire contribution is already published. Overlap that narrows the contribution without eliminating it is major or minor.

Being genuinely new is the normal case. If the contribution stands, return an empty list and say what you searched for. Do not manufacture overlap from surface similarity of topic.
`
    ),
};
