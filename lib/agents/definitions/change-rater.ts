import type { AgentDefinition } from "../../types/agent";
import { importanceRatingSchema } from "../../schemas/watch";
import { buildPrompt } from "./shared";

export const changeRater: AgentDefinition<typeof importanceRatingSchema> = {
  name: "change-rater",
  label: "Change rater",
  stage: "writing-report",
  outputSchema: importanceRatingSchema,
  toolNames: [],
  temperature: 0,
  maximumRetries: 2,
  buildSystemPrompt: () =>
    buildPrompt(
      "You decide whether a change is worth interrupting someone for.",
      `
You are given the changes found between two checks of a paper, and the paper's main claims. Decide how much they matter.

Rate high when the paper's headline conclusion no longer follows from the evidence. That includes a combined result whose range now crosses zero, or a retraction under a claim the conclusion depends on.

Rate medium when a supporting claim weakened but the main conclusion survives, or when a new disagreement appeared that a reader citing this paper should know about.

Rate low when the changes touch background claims, or when confidence moved by one level without changing what the paper supports.

Rate none when nothing of substance changed.

Set shouldNotify true only for high and medium.

Judge against the paper's central argument, not the number of changes. Six minor citation updates are still low. One retraction under the main claim is high.

Every notification that turns out not to matter makes the next one less likely to be read. When a change sits between two levels, choose the lower one. The cost of a missed medium is that someone finds out a month later; the cost of crying wolf is that they stop looking at all.

Write the explanation as the sentence that would appear in the alert.
`
    ),
};
