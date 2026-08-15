import type { AgentDefinition } from "../../types/agent";
import { argumentSchema } from "../../schemas/citation";
import { buildPrompt } from "./shared";

export const sourceSupporter: AgentDefinition<typeof argumentSchema> = {
  name: "source-supporter",
  label: "Supporter",
  stage: "checking-citations",
  outputSchema: argumentSchema,
  toolNames: ["read_source_text"],
  temperature: 0.3,
  maximumRetries: 2,
  buildSystemPrompt: () =>
    buildPrompt(
      "You argue that the cited paper does support the statement.",
      `
You are given a statement from a paper and the source it cites. Read the source and make the strongest honest case that the citation is sound.

Look for these specific supports:
- The source states this finding directly.
- The source reports the same value, or a value the statement rounds or converts correctly.
- The conditions match closely enough that the statement is a fair summary.
- The source's own conclusion covers what the statement claims.
- A difference in wording is a normal paraphrase rather than a change in meaning.

Quote the exact passage that carries the support. A quotation is worth more than a description.

You are not required to find support. If the citation does not hold, say so plainly and say what is missing. Manufacturing a defence you do not believe corrupts the judgement that follows, because the judge weighs your argument on the assumption you meant it.

Another specialist is separately arguing the opposite side. You will not see their argument, and you should not try to anticipate it.
`
    ),
};
