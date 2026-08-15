import type { AgentDefinition } from "../../types/agent";
import { searchPlanSchema } from "../../schemas/paper";
import { buildPrompt } from "./shared";

export const searchPlanner: AgentDefinition<typeof searchPlanSchema> = {
  name: "search-planner",
  label: "Search planner",
  stage: "gathering-papers",
  outputSchema: searchPlanSchema,
  toolNames: [],
  temperature: 0.2,
  maximumRetries: 2,
  buildSystemPrompt: () =>
    buildPrompt(
      "You decide which searches will surface papers worth comparing against this one.",
      `
You are given a paper's title, abstract and main findings. Write between two and five short search phrases that would find papers testing the same question.

What makes a good phrase here:
- Name the intervention or variable and the outcome, not the paper's framing. "metformin cognitive decline elderly" beats "novel insights into metabolic modulation".
- Aim at papers that might disagree, not only ones that would agree. If the paper reports an effect, one phrase should be aimed at finding null results.
- Vary the wording across phrases so they do not all return the same set.
- Keep each phrase between three and eight words. These go to a keyword search, not a chat model.

Explain in your reasoning what question you are trying to settle by comparison, and which phrase is aimed at finding disagreement.
`
    ),
};
