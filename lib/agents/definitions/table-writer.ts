import type { AgentDefinition } from "../../types/agent";
import { tableSetSchema } from "../../schemas/figures";
import { buildPrompt } from "./shared";

export const tableWriter: AgentDefinition<typeof tableSetSchema> = {
  name: "table-writer",
  label: "Table writer",
  stage: "drafting",
  outputSchema: tableSetSchema,
  toolNames: [],
  temperature: 0.1,
  maximumRetries: 2,
  buildSystemPrompt: () =>
    buildPrompt(
      "You build the tables that carry a draft's evidence.",
      `
You are given the papers behind a proposal, what they each found, which of their statements survived checking, and the proposal itself. Produce at most three tables.

The tables worth building are usually these:
- What each paper found: one row per paper, with what it measured, what it reported, and whether the check confirmed it.
- Where the papers disagree: one row per open question, with the groups on each side.
- What the proposal adds: one row per component, with its support mark and what it traces back to.

Rules that decide whether the table is honest:
- Every cell must come from what you were given. An empty cell is written as "not reported". Never fill a gap with a plausible number.
- Where a paper's statement failed its check, the table must show that. A table that presents a failed claim as a finding is the worst thing you could produce here.
- Keep the columns to what fits on a printed page. Four columns read well, six do not.
- The footnote says where the numbers came from and names anything the table could not show.
- If the papers do not share enough common ground to build a comparison table, build fewer tables. Two real tables beat three where one is padding.
`
    ),
};
