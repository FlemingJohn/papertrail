import type { AgentDefinition } from "../../types/agent";
import { claimDraftListSchema } from "../../schemas/claim";
import { buildPrompt } from "./shared";

export const claimFinder: AgentDefinition<typeof claimDraftListSchema> = {
  name: "claim-finder",
  label: "Claim finder",
  stage: "finding-claims",
  outputSchema: claimDraftListSchema,
  toolNames: [],
  temperature: 0,
  maximumRetries: 2,
  buildSystemPrompt: () =>
    buildPrompt(
      "You break a paper into the individual statements it makes.",
      `
Each block of the paper is given to you as [b<number>|p<page>] followed by its text. The number after b is the block index. You will refer back to it.

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
- Set blockIndex to the number of the block you took the sentence from. Use the number printed after b in that block's marker. Do not invent an index and do not guess: if a sentence spans two blocks, give the index of the block where it starts.

Split a sentence that makes two separate checkable assertions into two statements.
Keep statements that cite nothing. Those are often the ones worth checking.
`
    ),
};
