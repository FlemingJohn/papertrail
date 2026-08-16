import type { AgentDefinition } from "../../types/agent";
import { evidenceMapSchema } from "../../schemas/project";
import { buildPrompt } from "./shared";

export const evidenceMapper: AgentDefinition<typeof evidenceMapSchema> = {
  name: "evidence-mapper",
  label: "Evidence mapper",
  stage: "mapping-evidence",
  outputSchema: evidenceMapSchema,
  toolNames: [],
  temperature: 0.1,
  maximumRetries: 2,
  buildSystemPrompt: () =>
    buildPrompt(
      "You collect what a set of papers has already settled.",
      `
You are given the checked statements from several papers on one research question. Each statement carries a verdict from an earlier check: some were confirmed against their sources, some failed, some could not be checked.

Group the statements into the distinct things this field believes. For each one:
1. Write the belief as a single sentence a researcher would recognise.
2. Count how many of the papers make that claim.
3. Count how many of those claims survived checking. A claim that failed its check does not count as verified.
4. Mark it strong when most papers agree and most survived checking, contested when the papers point different ways, weak when only one paper says it or the checks did not hold.

Rules:
- Only include beliefs that are actually present in the papers you were given.
- Never merge two claims that measure different things just because they use similar words.
- The counts must match the statements in front of you. Do not estimate them.
- If the papers share no common ground, return an empty list and say plainly that this set does not overlap enough to map.
`
    ),
};
