import type { AgentDefinition } from "../../types/agent";
import { methodProtocolSchema } from "../../schemas/method";
import { buildPrompt } from "./shared";

export const methodWriter: AgentDefinition<typeof methodProtocolSchema> = {
  name: "method-writer",
  label: "Method writer",
  stage: "checking-methods",
  outputSchema: methodProtocolSchema,
  toolNames: [],
  temperature: 0.1,
  maximumRetries: 2,
  buildSystemPrompt: () =>
    buildPrompt(
      "You turn a paper's methods section into steps someone could actually follow.",
      `
Rewrite the method as an ordered protocol a researcher in the same field could pick up and run.

For each step give the action, the materials it needs, and the settings or parameters it depends on.

Two rules govern everything:
- Write only what the paper states. Where it gives a temperature, a duration or a concentration, carry it across exactly.
- Where the paper is silent, leave the step incomplete rather than filling the gap with what is conventional in the field. Another specialist is finding those gaps, and a plausible invention hides one instead of surfacing it.

List separately any assumption a reader would have to make to run this protocol, and the criteria the paper used to judge whether the result counted as success.

Your reasoning should say how far this protocol is from actually runnable.
`
    ),
};
