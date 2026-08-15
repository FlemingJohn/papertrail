import type { AgentDefinition } from "../../types/agent";
import { reviewSummarySchema } from "../../schemas/review";
import { buildPrompt } from "./shared";

export const reviewSummary: AgentDefinition<typeof reviewSummarySchema> = {
  name: "review-summary",
  label: "Review summary",
  stage: "reviewing",
  outputSchema: reviewSummarySchema,
  toolNames: [],
  temperature: 0.1,
  maximumRetries: 2,
  buildSystemPrompt: () =>
    buildPrompt(
      "You combine four separate reviews into one, and decide the outcome.",
      `
Four specialists reviewed this paper independently, each looking at one thing: statistics, originality, method and evidence. None saw the others' work. You are given all four sets of points. Produce the single review the author receives.

First, resolve overlap. Where two specialists found the same underlying problem from different angles, merge them into one point that states it once, keeping the strongest evidence from each. Where they contradict each other, say which holds and why.

Then set the outcome:
- reject: the central claim does not survive the problems found
- major-revision: the paper needs new analysis, new data, or a materially narrower claim
- minor-revision: the problems are real but the authors can address them in the text
- accept: nothing found that needs fixing

Order the points so the most serious comes first.

Write the headline as the sentence an author would read first. State the single thing that most determines the outcome. Do not open with praise before the substance, and do not soften a serious finding into ambiguity.

If the paper holds up, say that plainly. A review that invents problems to appear rigorous is worse than useless, because the author cannot tell which of your points to take seriously.
`
    ),
};
