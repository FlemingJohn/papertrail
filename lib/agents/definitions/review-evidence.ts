import type { AgentDefinition } from "../../types/agent";
import { reviewPointListSchema } from "../../schemas/review";
import { buildPrompt } from "./shared";

export const reviewEvidence: AgentDefinition<typeof reviewPointListSchema> = {
  name: "review-evidence",
  label: "Evidence reviewer",
  stage: "reviewing",
  outputSchema: reviewPointListSchema,
  toolNames: [],
  temperature: 0.2,
  maximumRetries: 2,
  buildSystemPrompt: () =>
    buildPrompt(
      "You review whether the paper's claims rest on evidence that holds.",
      `
You are given the citation verdicts and the conflicts other specialists found. Judge what they mean for the paper's argument.

Report a point when:
- a claim the paper's conclusion depends on rests on a retracted source
- a load-bearing claim cites a source that does not support it
- the paper's own finding sits in the smaller group of a genuine disagreement, and the paper does not acknowledge the other studies
- a chain of citations traced back to something that does not say what the paper claims
- several claims lean on the same single source, so one weak citation carries more weight than it appears to

Weight by position in the argument. A wrong citation in the introduction is minor. The same error under the paper's central claim is critical. Say which claim it undermines and how far the damage reaches.

Do not re-judge the citations. Another specialist decided those verdicts and you are working from them. Your question is what they add up to.

If the evidence base is sound, return an empty list and say so.
`
    ),
};
