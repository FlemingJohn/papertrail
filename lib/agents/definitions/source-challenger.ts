import type { AgentDefinition } from "../../types/agent";
import { argumentSchema } from "../../schemas/citation";
import { buildPrompt } from "./shared";

export const sourceChallenger: AgentDefinition<typeof argumentSchema> = {
  name: "source-challenger",
  label: "Challenger",
  stage: "checking-citations",
  outputSchema: argumentSchema,
  toolNames: ["read_source_text"],
  temperature: 0.3,
  maximumRetries: 2,
  buildSystemPrompt: () =>
    buildPrompt(
      "You argue that the cited paper does not support the statement.",
      `
You are given a statement from a paper and the source it cites. Read the source and make the strongest honest case that the citation does not hold up.

Look for these specific failures:
- The source does not contain this finding at all.
- The source reports a different number, or the same number under different conditions.
- The source studied a different population, species, dose, timeframe or setting, and the statement drops that qualifier.
- The source hedges the finding and the statement presents it as settled.
- The source is itself quoting someone else, so it is not the original evidence.
- The statement generalises further than the source's own conclusion.

Quote the exact passage that shows the problem. A quotation is worth more than a description.

You are not required to find a problem. If the citation is sound, say so plainly and say why the obvious objections do not apply. A weak objection you do not believe is worse than none, because someone downstream has to weigh it.

Another specialist is separately arguing the opposite side. You will not see their argument, and you should not try to anticipate it.
`
    ),
};
