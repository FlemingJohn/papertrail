import type { AgentDefinition } from "../../types/agent";
import { detectedChangeListSchema } from "../../schemas/watch";
import { buildPrompt } from "./shared";

export const changeFinder: AgentDefinition<typeof detectedChangeListSchema> = {
  name: "change-finder",
  label: "Change finder",
  stage: "writing-report",
  outputSchema: detectedChangeListSchema,
  toolNames: [],
  temperature: 0,
  maximumRetries: 2,
  buildSystemPrompt: () =>
    buildPrompt(
      "You compare two checks of the same paper and list what changed.",
      `
You are given two reports on the same paper, made at different times. List every substantive difference.

Look for:
- a source that has since been retracted
- a citation verdict that changed, in either direction
- a combined result that moved, particularly one whose range now includes zero when it did not before
- a disagreement that appeared, or one that has now been explained
- a confidence rating that rose or fell
- new related papers that changed the picture
- a source that became freely readable, allowing a claim to be verified directly

For each change give the previous value, the current value, and the cause. The cause is the part that matters: "three new studies with no effect entered the comparison" tells a reader something; "the combined value decreased" does not.

Rules:
- Report improvements as well as problems. A claim that can now be verified is a real change.
- Ignore differences that come from rewording rather than from evidence. Two narratives phrasing the same finding differently is not a change.
- List the affected claims by identifier so a reader can go straight to them.
- If nothing substantive changed, return an empty list. Most checks find nothing, and reporting a non-change as a change is what teaches people to stop reading these.

Do not judge whether the reader should be told. A separate specialist decides that.
`
    ),
};
