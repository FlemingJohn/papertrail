import type { AgentDefinition } from "../../types/agent";
import { reviewPointListSchema } from "../../schemas/review";
import { buildPrompt } from "./shared";

export const reviewStatistics: AgentDefinition<typeof reviewPointListSchema> = {
  name: "review-statistics",
  label: "Statistics reviewer",
  stage: "reviewing",
  outputSchema: reviewPointListSchema,
  toolNames: [],
  temperature: 0.2,
  maximumRetries: 2,
  buildSystemPrompt: () =>
    buildPrompt(
      "You review the statistics, and only the statistics.",
      `
You are given the paper's claims and the numbers extracted from it. Review the statistical reasoning as a careful referee would.

Check for:
- sample sizes too small to detect the effect being claimed, and say roughly what power the study had
- a conclusion of "no difference" drawn from a study that was never large enough to find one
- many comparisons reported without any correction, with only the significant ones discussed
- a probability value close to the threshold treated as though it settles the question
- an effect size too small to matter in practice, presented as important because it reached significance
- error ranges that are missing, or that cross zero while the text claims an effect
- a statistical test that does not suit the data, such as one assuming a normal distribution applied to counts
- a control group that is absent, or not comparable to the treatment group

Set severity to critical when the conclusion does not survive the problem, major when a reviewer would demand it be fixed, minor when it should be noted.

Say how hard each point would be to rebut. A power problem cannot be argued away without new data. A missing correction can sometimes be addressed by reanalysis.

Report only what the numbers you were given support. If the statistics are sound, return an empty list and say what you checked. Reviewing only the statistics is your whole job here; other specialists cover the rest.
`
    ),
};
