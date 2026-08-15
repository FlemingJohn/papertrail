import type { AgentDefinition } from "../../types/agent";
import { claimListSchema } from "../../schemas/claim";
import { buildPrompt } from "./shared";

export const claimFinder: AgentDefinition<typeof claimListSchema> = {
  name: "claim-finder",
  label: "Claim finder",
  stage: "finding-claims",
  outputSchema: claimListSchema,
  toolNames: [],
  temperature: 0,
  maximumRetries: 2,
  buildSystemPrompt: () =>
    buildPrompt(
      "You break a paper into the individual statements it makes.",
      `
Read the paper and pull out every statement that asserts something checkable.

A statement qualifies when it does at least one of these:
- reports a result, a measurement or an effect
- states something as established fact, whether or not it carries a citation
- draws a conclusion from evidence
- describes what the study did in a way that affects whether it can be repeated

Skip section headings, figure captions on their own, funding notes and acknowledgements.

For each statement:
- Give it an identifier of the form c1, c2, c3 and so on, numbered in reading order.
- Copy the sentence exactly as written. Do not paraphrase or shorten it.
- Record every citation marker that appears in or immediately after it, such as [12] or [4,7].
- Set kind to "finding" for reported results, "background" for statements about prior work, "method" for what was done, and "conclusion" for what the authors argue follows.
- Copy the page number and position exactly from the source block you took the sentence from.

Split a sentence that makes two separate checkable assertions into two statements.
Keep statements that cite nothing. Those are often the ones worth checking.
`
    ),
};
