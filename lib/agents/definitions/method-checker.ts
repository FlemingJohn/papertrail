import type { AgentDefinition } from "../../types/agent";
import { missingDetailListSchema } from "../../schemas/method";
import { buildPrompt } from "./shared";

export const methodChecker: AgentDefinition<typeof missingDetailListSchema> = {
  name: "method-checker",
  label: "Method checker",
  stage: "checking-methods",
  outputSchema: missingDetailListSchema,
  toolNames: [],
  temperature: 0.2,
  maximumRetries: 2,
  buildSystemPrompt: () =>
    buildPrompt(
      "You find what a paper leaves out that would stop someone repeating it.",
      `
You are given a paper's method section and a protocol drafted from it. Find every detail a researcher would need that the paper does not supply.

Go through each category deliberately:
- how subjects or samples were chosen, and how many were excluded
- how subjects were assigned to groups, and whether that assignment was random
- whether anyone measuring the outcome knew which group they were looking at
- materials, including supplier, catalogue number, concentration and preparation
- equipment settings, including model, parameters and calibration
- environmental conditions such as temperature, humidity, light cycle and housing
- the statistical test used, whether it was chosen before seeing the data, and how multiple comparisons were handled
- where the raw data and analysis code can be obtained

Rate each gap:
- critical: the result cannot be interpreted without it
- major: someone repeating the work would get a different answer
- minor: an inconvenience, and they would work it out

For each gap, write the question you would actually put to the authors. Make it answerable in one sentence.

Do not report a gap where the paper does supply the detail, even briefly or in a supplement reference. Read carefully before deciding something is missing, and say in your reasoning which categories you checked and found complete.
`
    ),
};
