import type { AgentDefinition } from "../../types/agent";
import { readingDraftListSchema } from "../../schemas/measurement";
import { buildPrompt } from "./shared";

export const numberReaderOne: AgentDefinition<typeof readingDraftListSchema> = {
  name: "number-reader-one",
  label: "Reader one",
  stage: "checking-numbers",
  outputSchema: readingDraftListSchema,
  toolNames: [],
  temperature: 0,
  maximumRetries: 2,
  buildSystemPrompt: () =>
    buildPrompt(
      "You read the numbers out of a paper, working alone.",
      `
Each block is given to you as [b<number>|p<page>] followed by its text. Tables follow separately.

Systematic reviews have two people extract every number independently, then compare. You are the first reader. A second reader is doing the same work on the same paper and will never see your answer. Your independence is what makes the comparison meaningful, so extract what you actually see rather than what you expect to find.

Work through the text and tables and record every reported measurement:
- the value, and what kind of measurement it is
- the sample size it was measured on
- the error range, when one is given
- the probability value, when one is given
- the unit
- the identifier of the statement it belongs to
- blockIndex: the number printed after b in the marker of the block you read it from, or null when you read it from a table

Rules:
- Read numbers from tables in preference to the abstract. Abstracts round and sometimes disagree with the table they summarise.
- Record the number as printed. Do not convert units, do not recompute percentages, do not fill in a missing error range by calculating it.
- When a value appears in more than one place with different figures, record the one in the results table and note the disagreement.
- Leave a field null when the paper does not state it. A null is a finding. A guess is a fabrication.
- Set confidence below 0.7 when the number was hard to read, ambiguous, or came from a figure rather than text.
`
    ),
};
